using UnityEngine;
using UnityEngine.InputSystem;
using UnityEngine.InputSystem.Controls;

namespace LifeSimulator.Input
{
    /// <summary>
    /// Android-first input adapter. Left lower screen area moves; right side rotates the camera.
    /// Keyboard and mouse are available in the Editor for quick iteration.
    /// </summary>
    public sealed class MobileInputReader : MonoBehaviour
    {
        [SerializeField] private float joystickRadius = 115f;
        [SerializeField] private float lookSensitivity = 0.12f;

        public Vector2 Move { get; private set; }
        public Vector2 LookDelta { get; private set; }

        private int moveTouchId = -1;
        private int lookTouchId = -1;
        private Vector2 moveOrigin;

        private void Update()
        {
            Move = Vector2.zero;
            LookDelta = Vector2.zero;

            if (Keyboard.current != null)
            {
                var keyboardMove = Vector2.zero;
                if (Keyboard.current.wKey.isPressed || Keyboard.current.upArrowKey.isPressed) keyboardMove.y += 1;
                if (Keyboard.current.sKey.isPressed || Keyboard.current.downArrowKey.isPressed) keyboardMove.y -= 1;
                if (Keyboard.current.dKey.isPressed || Keyboard.current.rightArrowKey.isPressed) keyboardMove.x += 1;
                if (Keyboard.current.aKey.isPressed || Keyboard.current.leftArrowKey.isPressed) keyboardMove.x -= 1;
                if (keyboardMove.sqrMagnitude > 1f) keyboardMove.Normalize();
                Move = keyboardMove;
            }

            var touchscreen = Touchscreen.current;
            if (touchscreen == null) return;

            bool moveFound = false;
            bool lookFound = false;
            foreach (TouchControl touch in touchscreen.touches)
            {
                if (!touch.press.isPressed) continue;

                int id = touch.touchId.ReadValue();
                Vector2 position = touch.position.ReadValue();

                if (position.x < Screen.width * 0.48f && position.y < Screen.height * 0.72f)
                {
                    if (moveTouchId == -1) { moveTouchId = id; moveOrigin = position; }
                    if (moveTouchId == id)
                    {
                        Move = Vector2.ClampMagnitude((position - moveOrigin) / joystickRadius, 1f);
                        moveFound = true;
                    }
                }
                else if (position.x >= Screen.width * 0.48f)
                {
                    if (lookTouchId == -1) lookTouchId = id;
                    if (lookTouchId == id)
                    {
                        LookDelta = touch.delta.ReadValue() * lookSensitivity;
                        lookFound = true;
                    }
                }
            }

            if (!moveFound) moveTouchId = -1;
            if (!lookFound) lookTouchId = -1;
        }

        private void OnGUI()
        {
            if (Touchscreen.current == null) return;
            float size = Mathf.Clamp(Screen.width * 0.22f, 90f, 150f);
            var rect = new Rect(24f, Screen.height - size - 28f, size, size);
            var old = GUI.color;
            GUI.color = new Color(1f, 1f, 1f, 0.16f);
            GUI.Box(rect, "MOVE");
            GUI.color = old;
            GUI.Label(new Rect(Screen.width - 150f, Screen.height - 58f, 140f, 30f), "DRAG TO LOOK");
        }
    }
}
