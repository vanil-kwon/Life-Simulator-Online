using LifeSimulator.Input;
using LifeSimulator.Life;
using LifeSimulator.Player;
using UnityEngine;
using UnityEngine.Rendering;

namespace LifeSimulator.World
{
    /// <summary>Creates a temporary playable greybox when the first scene loads.</summary>
    public sealed class PrototypeWorldBootstrap : MonoBehaviour
    {
        [RuntimeInitializeOnLoadMethod(RuntimeInitializeLoadType.AfterSceneLoad)]
        private static void CreatePrototype()
        {
            if (FindFirstObjectByType<PrototypeWorldBootstrap>() != null) return;
            new GameObject("Life Simulator 3D Prototype").AddComponent<PrototypeWorldBootstrap>();
        }

        private void Start()
        {
            BuildLighting();
            BuildCityBlock();

            var input = gameObject.AddComponent<MobileInputReader>();
            var player = GameObject.CreatePrimitive(PrimitiveType.Capsule);
            player.name = "Player";
            player.transform.position = new Vector3(0f, 1.1f, -7f);
            player.GetComponent<Renderer>().material = MakeMaterial(new Color(0.18f, 0.42f, 0.72f));
            var capsuleCollider = player.GetComponent<CapsuleCollider>();
            Destroy(capsuleCollider);
            var characterController = player.AddComponent<CharacterController>();
            characterController.height = 1.8f;
            characterController.radius = 0.34f;
            characterController.center = new Vector3(0f, 0.9f, 0f);
            player.AddComponent<NeedsComponent>();
            var motor = player.AddComponent<ThirdPersonMotor>();

            var cameraObject = new GameObject("Third Person Camera");
            var camera = cameraObject.AddComponent<Camera>();
            camera.tag = "MainCamera";
            camera.fieldOfView = 65f;
            camera.nearClipPlane = 0.08f;
            camera.farClipPlane = 350f;
            cameraObject.AddComponent<AudioListener>();
            var rig = cameraObject.AddComponent<OrbitCameraRig>();
            rig.Configure(player.transform, input);
            motor.Configure(cameraObject.transform, input);

            BuildCarPlaceholder();
            var hud = gameObject.AddComponent<PrototypeHud>();
            hud.Configure(player.GetComponent<NeedsComponent>());
        }

        private void BuildLighting()
        {
            RenderSettings.ambientLight = new Color(0.56f, 0.59f, 0.64f);
            var sunObject = new GameObject("Sun");
            var sun = sunObject.AddComponent<Light>();
            sun.type = LightType.Directional;
            sun.intensity = 1.15f;
            sun.transform.rotation = Quaternion.Euler(48f, -32f, 0f);
        }

        private void BuildCityBlock()
        {
            CreatePrimitive("Ground", PrimitiveType.Plane, new Vector3(0f, -0.08f, 0f), new Vector3(12f, 1f, 12f), new Color(0.28f, 0.34f, 0.29f));
            CreatePrimitive("Main Road", PrimitiveType.Cube, new Vector3(0f, 0.01f, 0f), new Vector3(8f, 0.12f, 90f), new Color(0.16f, 0.17f, 0.18f));
            CreatePrimitive("Side Road", PrimitiveType.Cube, new Vector3(0f, 0.02f, 0f), new Vector3(90f, 0.13f, 7f), new Color(0.19f, 0.2f, 0.21f));

            for (int i = 0; i < 9; i++)
            {
                float z = (i - 4) * 9f;
                CreateBuilding(new Vector3(-12f, 0f, z), new Vector3(9f, Random.Range(7f, 15f), 7f), i);
                CreateBuilding(new Vector3(12f, 0f, z + 3f), new Vector3(9f, Random.Range(8f, 18f), 8f), i + 9);
            }
        }

        private void CreateBuilding(Vector3 position, Vector3 size, int seed)
        {
            var building = GameObject.CreatePrimitive(PrimitiveType.Cube);
            building.name = "City Building";
            building.transform.position = position + Vector3.up * (size.y * 0.5f);
            building.transform.localScale = size;
            Color[] palette = {
                new Color(0.48f, 0.5f, 0.53f), new Color(0.64f, 0.58f, 0.48f),
                new Color(0.36f, 0.43f, 0.49f), new Color(0.58f, 0.59f, 0.55f)
            };
            building.GetComponent<Renderer>().material = MakeMaterial(palette[seed % palette.Length]);
        }

        private void BuildCarPlaceholder()
        {
            var car = CreatePrimitive("Car Prototype", PrimitiveType.Cube, new Vector3(4f, 0.65f, -5f), new Vector3(1.9f, 1.1f, 3.8f), new Color(0.12f, 0.42f, 0.52f));
            car.transform.rotation = Quaternion.Euler(0f, 90f, 0f);
        }

        private GameObject CreatePrimitive(string name, PrimitiveType type, Vector3 position, Vector3 scale, Color color)
        {
            var item = GameObject.CreatePrimitive(type);
            item.name = name;
            item.transform.position = position;
            item.transform.localScale = scale;
            item.GetComponent<Renderer>().material = MakeMaterial(color);
            return item;
        }

        private Material MakeMaterial(Color color)
        {
            Shader shader = GraphicsSettings.currentRenderPipeline != null
                ? Shader.Find("Universal Render Pipeline/Lit")
                : Shader.Find("Standard");
            if (shader == null) shader = Shader.Find("Standard");
            var material = new Material(shader);
            material.color = color;
            return material;
        }
    }

    public sealed class PrototypeHud : MonoBehaviour
    {
        private NeedsComponent needs;
        public void Configure(NeedsComponent component) => needs = component;

        private void OnGUI()
        {
            if (needs == null) return;
            GUI.color = new Color(0.05f, 0.07f, 0.09f, 0.82f);
            GUI.Box(new Rect(16f, 16f, 210f, 116f), GUIContent.none);
            GUI.color = Color.white;
            GUI.Label(new Rect(28f, 24f, 190f, 24f), "LIFE SIMULATOR 3D");
            GUI.Label(new Rect(28f, 48f, 190f, 20f), $"Health  {needs.Health:0}");
            GUI.Label(new Rect(28f, 68f, 190f, 20f), $"Energy  {needs.Energy:0}");
            GUI.Label(new Rect(28f, 88f, 190f, 20f), $"Hunger  {needs.Hunger:0}");
            GUI.Label(new Rect(28f, 108f, 190f, 20f), $"Hygiene {needs.Hygiene:0}");
        }
    }
}
