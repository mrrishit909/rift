"""RIFT subsurface kit: a utility manhole/shaft prop and a city building kit. Deterministic: same script -> same .blend and GLBs.
Run: Blender -b -P model/build.py   (writes model/source.blend, model/exports/*.glb, model/renders/poster.png)"""
import bpy, math, os, random

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, "exports")
os.makedirs(OUT, exist_ok=True)
os.makedirs(os.path.join(HERE, "renders"), exist_ok=True)

bpy.ops.wm.read_factory_settings(use_empty=True)
scene = bpy.context.scene

def mat(name, color, metal=0.0, rough=0.5, emit=None, strength=0.0):
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    b = m.node_tree.nodes["Principled BSDF"]
    b.inputs["Base Color"].default_value = (*color, 1)
    b.inputs["Metallic"].default_value = metal
    b.inputs["Roughness"].default_value = rough
    if emit:
        b.inputs["Emission Color"].default_value = (*emit, 1)
        b.inputs["Emission Strength"].default_value = strength
    return m

M = {
    "iron": mat("Iron", (0.11, 0.09, 0.08), 0.6, 0.6),
    "concrete": mat("Concrete", (0.42, 0.41, 0.39), 0, 0.85),
    "magma": mat("Magma", (0.5, 0.1, 0.02), 0, 0.4, (1.0, 0.29, 0.09), 3.0),
    "glass": mat("WindowGlass", (0.05, 0.08, 0.1), 0.2, 0.15, (0.95, 0.76, 0.29), 0.3),
}

def obj(name, mesh_fn, material, loc=(0, 0, 0), parent=None):
    bpy.ops.object.select_all(action="DESELECT")
    mesh_fn()
    o = bpy.context.active_object
    o.name = name
    o.location = loc
    o.data.materials.append(M[material] if isinstance(material, str) else material)
    if parent:
        o.parent = parent
    return o

def empty(name, loc, parent=None):
    e = bpy.data.objects.new(name, None)
    scene.collection.objects.link(e)
    e.location = loc
    if parent:
        e.parent = parent
    return e

def smooth(o):
    for p in o.data.polygons: p.use_smooth = True

# --- infrastructure prop: a manhole shaft with a ladder, used instanced at infra nodes
shaft_root = empty("InfraShaft", (0, 0, 0))
ring = obj("ShaftRing", lambda: bpy.ops.mesh.primitive_cylinder_add(vertices=20, radius=0.6, depth=0.08), "iron", (0, 0, 0), shaft_root)
collar = obj("ShaftCollar", lambda: bpy.ops.mesh.primitive_cylinder_add(vertices=20, radius=0.55, depth=2.4, rotation=(0, 0, 0)), "concrete", (0, 0, -1.2), shaft_root)
for i in range(6):
    rung = obj(f"Rung{i}", lambda: bpy.ops.mesh.primitive_cylinder_add(vertices=8, radius=0.025, depth=0.5, rotation=(0, math.pi / 2, 0)), "iron", (0, 0.3, -0.3 - i * 0.35), shaft_root)
glow = obj("ShaftGlow", lambda: bpy.ops.mesh.primitive_circle_add(vertices=20, radius=0.5, fill_type="NGON"), "magma", (0, 0, -2.39), shaft_root)
smooth(collar)

# --- city building kit: 5 variants, modular, stable names for the browser to colour by risk
kit = empty("BuildingKit", (0, 0, 0))
random.seed(21)
def building(name, w, d, h, floors, idx):
    o = obj(name, lambda: bpy.ops.mesh.primitive_cube_add(size=1), "concrete", (idx * 6, 0, h / 2), kit)
    o.scale = (w, d, h)
    windows = obj(f"{name}Windows", lambda: bpy.ops.mesh.primitive_cube_add(size=1), "glass", (idx * 6, d / 2 + 0.01, h / 2), kit)
    windows.scale = (w * 0.92, 0.01, h * 0.92)
    return o
for i, (w, d, h) in enumerate([(4, 4, 3.5), (6, 6, 9), (3.5, 5, 2.8), (8, 8, 22), (5, 5, 2.6)]):
    building(f"Building{i+1}", w, d, h, 1, i)

# --- poster: shaft + one building, three-quarter view
def hide(o):
    o.hide_render = True
    for c in o.children: hide(c)
bpy.ops.object.camera_add(location=(7, -9, 6)); cam_o = bpy.context.active_object
cam_o.name = "PosterCam"; scene.camera = cam_o; cam_o.data.lens = 38
cam_o.rotation_euler = (1.15, 0, 0.62)
for name, loc, e, col in (("Key", (-4, -8, 8), 1200, (1, 0.95, 0.85)), ("Rim", (8, 4, 5), 700, (1.0, 0.29, 0.09)), ("Fill", (0, -4, -2), 300, (0.9, 0.86, 0.8))):
    bpy.ops.object.light_add(type="POINT", location=loc); l = bpy.context.active_object
    l.name = name; l.data.energy = e; l.data.color = col
world = bpy.data.worlds.new("Basalt"); scene.world = world; world.use_nodes = True
world.node_tree.nodes["Background"].inputs[0].default_value = (0.02, 0.018, 0.016, 1)
scene.render.engine = "BLENDER_EEVEE_NEXT"
scene.render.resolution_x, scene.render.resolution_y = 1280, 720
scene.render.filepath = os.path.join(HERE, "renders", "poster.png")

def export(name, parents):
    bpy.ops.object.select_all(action="DESELECT")
    def pick(o):
        o.select_set(True)
        for c in o.children: pick(c)
    for p in parents: pick(p)
    bpy.ops.export_scene.gltf(filepath=os.path.join(OUT, name), export_format="GLB", use_selection=True,
                              export_apply=True, export_yup=True, export_cameras=False, export_lights=False)

export("infra-shaft.glb", [shaft_root])
export("building-kit.glb", [kit])
bpy.ops.wm.save_as_mainfile(filepath=os.path.join(HERE, "source.blend"))
try:
    bpy.ops.render.render(write_still=True)
except Exception as e:
    print("poster render failed:", e)
print("BUILD OK")
