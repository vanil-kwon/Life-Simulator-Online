using LifeSimulator.Input;
using UnityEngine;

namespace LifeSimulator.Player
{
    public sealed class OrbitCameraRig : MonoBehaviour
    {
        [SerializeField] private Transform target;
        [SerializeField] private MobileInputReader inputReader;
        [SerializeField] private Vector3 offset = new Vector3(0f, 2.8f, -5.2f);
        [SerializeField] private float followSharpness = 12f;
        [SerializeField] private float pitch = 12f;
        [SerializeField] private float minPitch = -15f;
        [SerializeField] private float maxPitch = 55f;
        [SerializeField] private float lookSensitivity = 2.2f;

        private float yaw;

        public void Configure(Transform followTarget, MobileInputReader reader)
        {
            target = followTarget;
            inputReader = reader;
            yaw = followTarget.eulerAngles.y;
        }

        private void LateUpdate()
        {
            if (target == null) return;

            Vector2 look = inputReader != null ? inputReader.LookDelta : Vector2.zero;
            yaw += look.x * lookSensitivity;
            pitch = Mathf.Clamp(pitch - look.y * lookSensitivity, minPitch, maxPitch);

            Quaternion rotation = Quaternion.Euler(pitch, yaw, 0f);
            Vector3 desiredPosition = target.position + rotation * offset;
            transform.position = Vector3.Lerp(transform.position, desiredPosition, followSharpness * Time.deltaTime);
            transform.rotation = Quaternion.LookRotation(target.position + Vector3.up * 1.5f - transform.position);
        }
    }
}
