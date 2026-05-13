fix these issues:
1) The Diamond Tool Disconnect: As evidenced in image_2c3615.png, when the "Diamond" tool is actively selected (highlighted) in the floating toolbar, the resulting shape generated on the canvas is incorrectly rendered as a rounded rectangle.

Systemic Rendering Failure: This behavior is not isolated to the diamond tool. Selecting any of the available shapes from the toolbar fails to produce the advertised geometry, resulting in a rectangle every time.

Expected Behavior
Clicking a specific shape icon in the toolbar should map directly to the canvas rendering engine to create that exact geometric shape (e.g., clicking the diamond creates a diamond, clicking the circle creates a circle).