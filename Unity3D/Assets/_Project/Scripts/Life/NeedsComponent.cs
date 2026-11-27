using UnityEngine;

namespace LifeSimulator.Life
{
    public sealed class NeedsComponent : MonoBehaviour
    {
        public float Health { get; private set; } = 100f;
        public float Energy { get; private set; } = 100f;
        public float Hunger { get; private set; } = 100f;
        public float Hygiene { get; private set; } = 100f;

        private const string SaveKey = "life3d.needs.v1";
        private float saveTimer;

        [System.Serializable]
        private struct NeedsSave
        {
            public float health, energy, hunger, hygiene;
        }

        private void Start() => Load();

        private void Update()
        {
            float dt = Time.deltaTime;
            Hunger = Mathf.Max(0f, Hunger - dt * 0.018f);
            Hygiene = Mathf.Max(0f, Hygiene - dt * 0.009f);
            Energy = Mathf.Max(0f, Energy - dt * 0.004f);

            if (Hunger < 12f || Hygiene < 8f) Health = Mathf.Max(1f, Health - dt * 0.025f);

            saveTimer += dt;
            if (saveTimer >= 15f) { saveTimer = 0f; Save(); }
        }

        public void Eat(float amount = 30f) => Hunger = Mathf.Clamp(Hunger + amount, 0f, 100f);
        public void Shower(float amount = 45f) => Hygiene = Mathf.Clamp(Hygiene + amount, 0f, 100f);

        public void Rest(float hours = 8f)
        {
            Energy = Mathf.Clamp(Energy + hours * 10f, 0f, 100f);
            Health = Mathf.Clamp(Health + hours * 1.5f, 0f, 100f);
        }

        public void Save()
        {
            var data = new NeedsSave { health = Health, energy = Energy, hunger = Hunger, hygiene = Hygiene };
            PlayerPrefs.SetString(SaveKey, JsonUtility.ToJson(data));
            PlayerPrefs.Save();
        }

        private void Load()
        {
            if (!PlayerPrefs.HasKey(SaveKey)) return;
            var data = JsonUtility.FromJson<NeedsSave>(PlayerPrefs.GetString(SaveKey));
            Health = Mathf.Clamp(data.health, 1f, 100f);
            Energy = Mathf.Clamp(data.energy, 0f, 100f);
            Hunger = Mathf.Clamp(data.hunger, 0f, 100f);
            Hygiene = Mathf.Clamp(data.hygiene, 0f, 100f);
        }

        private void OnApplicationPause(bool paused) { if (paused) Save(); }
        private void OnApplicationQuit() => Save();
    }
}
