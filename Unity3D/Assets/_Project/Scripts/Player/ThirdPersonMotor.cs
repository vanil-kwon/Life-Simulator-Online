using LifeSimulator.Input;
using UnityEngine;
using UnityEngine.InputSystem;

namespace LifeSimulator.Player
{
    [RequireComponent(typeof(CharacterController))]
    public sealed class ThirdPersonMotor : MonoBehaviour
    {
        [SerializeField] private float walkSpeed = 4.2f;
        [SerializeField] private float sprintSpeed = 6.2f;
        [SerializeField] private float rotationSharpness = 14f;
        [SerializeField] private float gravity = -22f;
        [SerializeField] private Transform cameraTransform;
        [SerializeField] private MobileInputReader inputReader;

        private CharacterController controller;
        private float verticalSpeed;

        private void Awake()
        {
            controller = GetComponent<CharacterController>();
            if (Camera.main != null) cameraTransform = Camera.main.transform;
        }

        public void Configure(Transform cameraRig, MobileInputReader reader)
        {
            cameraTransform = cameraRig;
            inputReader = reader;
        }

        private void Update()
        {
            Vector2 input = inputReader != null ? inputReader.Move : Vector2.zero;
            Vector3 forward = cameraTransform != null ? cameraTransform.forward : Vector3.forward;
            Vector3 right = cameraTransform != null ? cameraTransform.right : Vector3.right;
            forward.y = 0f;
            right.y = 0f;
            forward.Normalize();
            right.Normalize();

            Vector3 direction = Vector3.ClampMagnitude(forward * input.y + right * input.x, 1f);
            bool sprint = Keyboard.current != null && Keyboard.current.leftShiftKey.isPressed;
            float speed = sprint ? sprintSpeed : walkSpeed;

            if (direction.sqrMagnitude > 0.001f)
            {
                Quaternion targetRotation = Quaternion.LookRotation(direction, Vector3.up);
                transform.rotation = Quaternion.Slerp(transform.rotation, targetRotation, rotationSharpness * Time.deltaTime);
            }

            if (controller.isGrounded && verticalSpeed < 0f) verticalSpeed = -2f;
            verticalSpeed += gravity * Time.deltaTime;
            Vector3 velocity = direction * speed;
            velocity.y = verticalSpeed;
            controller.Move(velocity * Time.deltaTime);
        }
    }
}
