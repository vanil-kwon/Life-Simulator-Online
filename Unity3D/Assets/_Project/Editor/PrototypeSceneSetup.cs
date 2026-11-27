#if UNITY_EDITOR
using UnityEditor;
using UnityEditor.SceneManagement;
using UnityEngine.SceneManagement;

namespace LifeSimulator.Editor
{
    public static class PrototypeSceneSetup
    {
        private const string ScenePath = "Assets/_Project/Scenes/Prototype.unity";

        [MenuItem("Life Simulator/Create Prototype Scene")]
        public static void CreatePrototypeScene()
        {
            System.IO.Directory.CreateDirectory("Assets/_Project/Scenes");
            var scene = EditorSceneManager.NewScene(NewSceneSetup.EmptyScene, NewSceneMode.Single);
            EditorSceneManager.SaveScene(scene, ScenePath);
            EditorBuildSettings.scenes = new[]
            {
                new EditorBuildSettingsScene(ScenePath, true)
            };
            AssetDatabase.Refresh();
            UnityEngine.Debug.Log("Life Simulator: prototype scene created and added to Build Settings.");
        }
    }
}
#endif
