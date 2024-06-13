// Eco-mode: Only render if window focused
window.onblur = function () {
    noLoop();
};
window.onfocus = function () {
    loop();
};

//!!!font-drag and drop + select-working!!!!

/* CUSTOM FUNCTIONS FOR P5LIVE */
// Keep fullscreen if window resized
function windowResized() {
    resizeCanvas(windowWidth, windowHeight);
}

// Custom ease function
function ease(iVal, oVal, eVal) {
    return oVal += (iVal - oVal) * eVal;
}

// Processing compatibility
function println(msg) {
    print(msg);
}

let fontPath = 'includes/demos-data/fonts/RobotoMono-Regular.otf';
let path, pathClone;
let selectedPoint = null;
let offsetX, offsetY;
let input, button, animateButton, guiHolder, inputGuiHolder, exportGuiHolder, resetButton;
let textScaleSlider, strokeWeightSlider, pointStrokeWeightSlider, backgroundOpacitySlider, textColorPicker, lerpSlider, circlesCheckbox, transitionCheckbox, animateCheckbox, lerpSpeedSlider, animationSpeedSlider, exportImageButton, exportAnimationButton, backgroundColorPicker;
let currentText = 'HELLO';
let currentTextScale = 1; // Default text scale
let currentStrokeWeight = 2; // Default stroke weight
let animationSpeed = 5;
let isAnimating = false;
let myFont;
let nr = 1;
let dropZone;
let cmdOG, cmdClone; // LERP
let myScale = 1; // Default scale
let circlesChecked = false;
let transitionChecked = false;
let backgroundOpacity = 255; // Default opacity
let currentPointStrokeWeight = 2; // Default stroke weight for points
let bgColor = '#000000'; // Default background color
let textColor = '#ffffff'; // Default text/font color
let fileInput, customFileUpload;
let recording = false;
let capturer;
let recordDuration = 300; // Duration of the recording in frames (e.g., 5 seconds at 60 fps)
let recordStartFrame = 0;
let noiseOffsetX = [];
let noiseOffsetY = [];

// Add an event listener to the transition checkbox to update the transitionChecked variable
function setupTransitionCheckbox() {
    transitionCheckbox.changed(function () {
        transitionChecked = this.checked();
    });
}

// Add an event listener to the circles checkbox to update the circlesChecked variable
function setupCirclesCheckbox() {
    circlesCheckbox.changed(function () {
        circlesChecked = this.checked();
    });
}

function setup() {
    createCanvas(windowWidth * 0.8, windowHeight * 0.8);
    noFill();
    background(bgColor); // Set the default background color

    // GUI for input, update button, drop zone, and file input
    inputGuiHolder = createDiv().class('input-gui-holder');

    // Add the container div for input field and button
    let inputContainer = createDiv();
    inputContainer.parent(inputGuiHolder).class('input-container');

    // Input field (write Text in it)
    input = createInput(currentText);
    input.parent(inputContainer).class('input-field');

    // Button "Update Text"
    button = createButton('Update');
    button.parent(inputContainer).class('update-button');
    button.mousePressed(updateText);

    // Font container for drop zone and file input
    let fontContainer = createDiv();
    fontContainer.parent(inputGuiHolder).class('font-container');

    // Font drop zone
    dropZone = createDiv('Drag and Drop');
    dropZone.parent(fontContainer).class('dropZone');
    dropZone.dragOver(highlight);
    dropZone.dragLeave(unhighlight);
    dropZone.drop(gotFile, unhighlight);

    // Font file input
    fileInput = createFileInput(handleFile);
    fileInput.parent(fontContainer);
    fileInput.class('font-input');

    // Custom file upload button
    customFileUpload = createButton('Select a Font');
    customFileUpload.parent(fontContainer);
    customFileUpload.class('custom-file-upload');
    customFileUpload.mousePressed(() => fileInput.elt.click());

    // GUI for other controls
    guiHolder = createDiv().class('gui-holder');

    // Create a container for the two columns
    let columnContainer = createDiv().class('column-container');
    columnContainer.parent(guiHolder);

    // Column 1
    let column1 = createDiv().class('column');
    column1.parent(columnContainer);

    let column1Title = createDiv('TYPO').class('column-title');
    column1Title.parent(column1);

    // Add GUI elements to column 1
    let textScaleContainer = createDiv().class('slider-container');
    textScaleContainer.parent(column1);
    createDiv('Scale').parent(textScaleContainer).class('textScaleSlider');
    textScaleSlider = createSlider(0.01, 5, currentTextScale, .001);
    textScaleSlider.parent(textScaleContainer).class('textScaleSlider');
    textScaleSlider.input(updateTextScale);

    let strokeWeightContainer = createDiv().class('slider-container');
    strokeWeightContainer.parent(column1);
    createDiv('Stroke').parent(strokeWeightContainer).class('strokeWeightSlider');
    strokeWeightSlider = createSlider(0.01, 100, currentStrokeWeight, .001);
    strokeWeightSlider.parent(strokeWeightContainer).class('strokeWeightSlider');
    strokeWeightSlider.input(updateStrokeWeight);

    circlesCheckbox = createCheckbox('Points', false);
    circlesCheckbox.parent(column1).class('circlesCheckbox');
    setupCirclesCheckbox();

    let pointStrokeWeightContainer = createDiv().class('slider-container');
    pointStrokeWeightContainer.parent(column1);
    createDiv('Size').parent(pointStrokeWeightContainer).class('pointStrokeWeightSlider');
    pointStrokeWeightSlider = createSlider(0.01, 100, currentPointStrokeWeight, .001);
    pointStrokeWeightSlider.parent(pointStrokeWeightContainer).class('pointStrokeWeightSlider');
    pointStrokeWeightSlider.input(updatePointStrokeWeight);

    createDiv('Color').parent(column1).class('colorPicker');
    textColorPicker = createColorPicker(textColor);
    textColorPicker.parent(column1).class('colorPicker');
    textColorPicker.input(updateTextColor);

    createDiv('Background Color').parent(column1).class('backgroundColorPicker');
    backgroundColorPicker = createColorPicker(bgColor);
    backgroundColorPicker.parent(column1).class('backgroundColorPicker');
    backgroundColorPicker.input(updateBackgroundColor);

    // Column 2
    let column2 = createDiv().class('column');
    column2.parent(columnContainer);

    let column2Title = createDiv('ANIMATE').class('column-title');
    column2Title.parent(column2);

    // Add GUI elements to column 2
    transitionCheckbox = createCheckbox('Animate', false);
    transitionCheckbox.parent(column2).class('transitionCheckbox');
    setupTransitionCheckbox();

    let lerpSliderContainer = createDiv().class('slider-container');
    lerpSliderContainer.parent(column2);
    createDiv('Transition').parent(lerpSliderContainer).class('lerpSlider');
    lerpSlider = createSlider(0, 1, 1, 0.01); // Min, max, initial value, step
    lerpSlider.parent(lerpSliderContainer).class('lerpSlider');

   // Create a container for the Transition Speed slider
let lerpSpeedSliderContainer = createDiv().class('slider-container-2');
lerpSpeedSliderContainer.parent(column2);
createDiv('Transition Speed').parent(lerpSpeedSliderContainer).class('slider-label');
lerpSpeedSlider = createSlider(0.01, 5, 1, 0.01); // Speed for lerp animation
lerpSpeedSlider.parent(lerpSpeedSliderContainer).class('lerpSpeedSlider');   

    animateCheckbox = createCheckbox('Random');
    animateCheckbox.parent(column2).class('animateCheckbox');
    animateCheckbox.mousePressed(toggleAnimation);

    let animationSpeedSliderContainer = createDiv().class('slider-container');
    animationSpeedSliderContainer.parent(column2);
    createDiv('Random Speed').parent(animationSpeedSliderContainer).class('animationSpeedSlider');
    animationSpeedSlider = createSlider(0.01, 10, 1, 0.01); // Speed for random animation
    animationSpeedSlider.parent(animationSpeedSliderContainer).class('animationSpeedSlider');

    // Create a container for the Trace slider
let backgroundOpacitySliderContainer = createDiv().class('slider-container-2');
backgroundOpacitySliderContainer.parent(column2);
createDiv('Trace').parent(backgroundOpacitySliderContainer).class('slider-label');
backgroundOpacitySlider = createSlider(0, 255, backgroundOpacity);
backgroundOpacitySlider.parent(backgroundOpacitySliderContainer).class('backgroundOpacitySlider');
setupBackgroundOpacitySlider();


    // Create a new GUI holder for export buttons
    exportGuiHolder = createDiv().class('export-gui-holder');
    exportGuiHolder.parent(column2); // Place within column 2

    exportImageButton = createButton('Export Image');
    exportImageButton.parent(exportGuiHolder).class('exportImageButton');
    exportImageButton.mousePressed(exportImage);

    exportAnimationButton = createButton('Export Video');
    exportAnimationButton.parent(exportGuiHolder).class('exportAnimationButton');
    exportAnimationButton.mousePressed(exportAnimation);

    // Create the reset button
    resetButton = createButton('Reset');
    resetButton.class('resetButton');
    resetButton.position(windowWidth - 100, windowHeight - 50); // Adjust position as needed
    resetButton.mousePressed(resetTextTransition);

    // Generate the default text
    updateText();

    // Create the toggle button for the GUI holder
    let toggleButton = createButton('Hide');
    toggleButton.class('toggleButton');
    toggleButton.mousePressed(toggleGUI);

    // Create the toggle button for the input GUI holder
    let toggleInputButton = createButton('Hide');
    toggleInputButton.class('toggleInputButton');
    toggleInputButton.mousePressed(toggleInputGUI);
}

function draw() {
    // Convert hex color to RGB
    let bgColorHex = bgColor.slice(1); // Remove the '#' from the hex color
    let r = parseInt(bgColorHex.substring(0, 2), 16);
    let g = parseInt(bgColorHex.substring(2, 4), 16);
    let b = parseInt(bgColorHex.substring(4, 6), 16);

    // Set the background color with the specified opacity
    background(`rgba(${r}, ${g}, ${b}, ${backgroundOpacity / 255})`);

    // Set the text/font stroke color
    stroke(textColor);
    noFill(); // Ensure no fill is applied to the text

    translate(width / 2, height / 2);

    let osc = 0; // sin(frameCount * .01) * 15

    // Get the current value of the lerpSlider
    let lerpAmt = lerpSlider.value();

    // Get current stroke weight from the slider
    currentStrokeWeight = strokeWeightSlider.value();

    // Get the speed for lerp and animation
    let lerpSpeed = lerpSpeedSlider.value();
    let randomSpeed = animationSpeedSlider.value();

    // Cycle path if ready
    if (path && pathClone) { // Check if path and pathClone are initialized
        let c = 0;
        strokeWeight(currentStrokeWeight);
        for (let i = 0; i < pathClone.commands.length; i++) {
            let cmdClone = pathClone.commands[i]; // clone
            let cmdOG = path.commands[i]; // original
            let cmd = JSON.parse(JSON.stringify(cmdClone));

            // If the transition checkbox is checked, animate the transition
            if (transitionChecked) {
                // Calculate the new lerpAmt for animation
                lerpAmt = sin(frameCount * 0.1 * lerpSpeed) * 0.5 + 0.5;
            }

            // LERP
            cmd.x = lerp(cmdOG.x, cmdClone.x, lerpAmt);
            cmd.y = lerp(cmdOG.y, cmdClone.y, lerpAmt);

            // Update the position if a point is being dragged
            if (selectedPoint == cmdClone) {
                cmdClone.x = (mouseX - width / 2 + offsetX) / myScale;
                cmdClone.y = (mouseY - height / 2 + offsetY) / myScale;
            }

            // Draw the circles if circles checkbox is checked
            if (circlesChecked) {
                push();
                scale(myScale);
                if (cmd.type === 'M' || cmd.type === 'L') {
                    circle(cmd.x, cmd.y, 4 / myScale);
                } else if (cmd.type === 'C') {
                    circle(cmd.x, cmd.y, 4 / myScale);
                    circle(cmd.x1, cmd.y1, 4 / myScale);
                    circle(cmd.x2, cmd.y2, 4 / myScale);
                } else if (cmd.type === 'Q') {
                    circle(cmd.x, cmd.y, 4 / myScale);
                    circle(cmd.x1, cmd.y1, 4 / myScale);
                }
                pop();
            }

            // Draw the path
            if (cmd.type === 'M') {
                push();
                rotate(radians(osc));
                beginShape();
                vertex(cmd.x * myScale, cmd.y * myScale);
            } else if (cmd.type === 'L') {
                vertex(cmd.x * myScale, cmd.y * myScale);
            } else if (cmd.type === 'C') {
                bezierVertex(cmd.x1 * myScale, cmd.y1 * myScale, cmd.x2 * myScale, cmd.y2 * myScale, cmd.x * myScale, cmd.y * myScale);
            } else if (cmd.type === 'Q') {
                quadraticVertex(cmd.x1 * myScale, cmd.y1 * myScale, cmd.x * myScale, cmd.y * myScale);
            } else if (cmd.type === 'Z') {
                endShape(CLOSE);
                pop();
            }
        }

        // Apply animation if the animate button is pressed
        if (isAnimating) {
            for (let i = 0; i < pathClone.commands.length; i++) {
                let cmd = pathClone.commands[i];
                // Randomly adjust the control points using Perlin noise
                cmd.x += map(noise(noiseOffsetX[i]), 0, 1, -randomSpeed, randomSpeed);
                cmd.y += map(noise(noiseOffsetY[i]), 0, 1, -randomSpeed, randomSpeed);
                noiseOffsetX[i] += 0.01 * randomSpeed; // Increment noise offset
                noiseOffsetY[i] += 0.01 * randomSpeed; // Increment noise offset

                // Ensure control points stay within canvas bounds
                cmd.x = constrain(cmd.x, -width / 2 / myScale, width / 2 / myScale);
                cmd.y = constrain(cmd.y, -height / 2 / myScale, height / 2 / myScale);
            }
        }

        // Draw the circles if circles checkbox is checked
        if (circlesChecked) {
            push();
            scale(myScale);
            strokeWeight(currentPointStrokeWeight); // Set stroke weight for points
            for (let cmd of pathClone.commands) {
                if (cmd.type === 'M' || cmd.type === 'L') {
                    circle(cmd.x, cmd.y, 4 / myScale);
                } else if (cmd.type === 'C') {
                    circle(cmd.x, cmd.y, 4 / myScale);
                    circle(cmd.x1, cmd.y1, 4 / myScale);
                    circle(cmd.x2, cmd.y2, 4 / myScale);
                } else if (cmd.type === 'Q') {
                    circle(cmd.x, cmd.y, 4 / myScale);
                    circle(cmd.x1, cmd.y1, 4 / myScale);
                }
            }
            pop();
        }
    }

    // Capture the frame if recording
    if (recording) {
        capturer.capture(document.querySelector('canvas'));
        if (frameCount >= recordStartFrame + recordDuration) {
            recording = false;
            capturer.stop();
            capturer.save();
            exportAnimationButton.html('Export Animation');
        }
    }
}

function mousePressed() {
    if (pathClone) {
        for (let cmd of pathClone.commands) {
            // Check if a point is clicked and set it as the selected point
            if (dist((mouseX - width / 2) / myScale, (mouseY - height / 2) / myScale, cmd.x, cmd.y) < 10 / myScale) {
                selectedPoint = cmd;
                offsetX = cmd.x * myScale - (mouseX - width / 2);
                offsetY = cmd.y * myScale - (mouseY - height / 2);
                break;
            }
            if (cmd.type === 'C') {
                if (dist((mouseX - width / 2) / myScale, (mouseY - height / 2) / myScale, cmd.x1, cmd.y1) < 10 / myScale) {
                    selectedPoint = { cmd, key: 'x1', key2: 'y1' };
                    offsetX = cmd.x1 * myScale - (mouseX - width / 2);
                    offsetY = cmd.y1 * myScale - (mouseY - height / 2);
                    break;
                }
                if (dist((mouseX - width / 2) / myScale, (mouseY - height / 2) / myScale, cmd.x2, cmd.y2) < 10 / myScale) {
                    selectedPoint = { cmd, key: 'x2', key2: 'y2' };
                    offsetX = cmd.x2 * myScale - (mouseX - width / 2);
                    offsetY = cmd.y2 * myScale - (mouseY - height / 2);
                    break;
                }
            }
            if (cmd.type === 'Q') {
                if (dist((mouseX - width / 2) / myScale, (mouseY - height / 2) / myScale, cmd.x1, cmd.y1) < 10 / myScale) {
                    selectedPoint = { cmd, key: 'x1', key2: 'y1' };
                    offsetX = cmd.x1 * myScale - (mouseX - width / 2);
                    offsetY = cmd.y1 * myScale - (mouseY - height / 2);
                    break;
                }
            }
        }
    }
}

function mouseDragged() {
    if (selectedPoint) {
        let cmd = selectedPoint.cmd || selectedPoint;
        let key = selectedPoint.key || 'x';
        let key2 = selectedPoint.key2 || 'y';
        cmd[key] = (mouseX - width / 2 + offsetX) / myScale;
        cmd[key2] = (mouseY - height / 2 + offsetY) / myScale;
    }
}

function mouseReleased() {
    // Deselect the point when the mouse is released
    selectedPoint = null;
}

function genOpenType(txtString, txtSize) {
    opentype.load(fontPath, function (err, f) {
        if (err) {
            print('Error loading font: ' + err);
        } else {
            // Grab once for measuring
            path = f.getPath(txtString, 0, 0, txtSize);
            let bounds = path.getBoundingBox();

            // Reposition to 0, 0 as center (for WEBGL, rotate, etc)
            path = f.getPath(txtString, -(bounds.x2 - bounds.x1) / 2, (bounds.y2 - bounds.y1) / 2, txtSize);

            pathClone = JSON.parse(JSON.stringify(path));
            
            // Initialize noise offsets
            initializeNoiseOffsets();
        }
    });
}

function gotFile(file) {
    if (file.type === 'font') {
        fontPath = file.data;
        updateText();
    } else {
        alert('Please select a valid font file.');
    }
}

// Function to update text scale
function updateTextScale() {
    myScale = textScaleSlider.value();
}

// Function to update stroke weight
function updateStrokeWeight() {
    currentStrokeWeight = strokeWeightSlider.value();
}

// Function to update point stroke weight
function updatePointStrokeWeight() {
    currentPointStrokeWeight = pointStrokeWeightSlider.value();
}

// Function to update text content
function updateText() {
    currentText = input.value();
    // Calculate the dynamic text size based on the canvas width and text length
    let dynamicTextSize = width / currentText.length * 1.3;
    genOpenType(currentText, dynamicTextSize);
}

// Function to toggle animation
function toggleAnimation() {
    isAnimating = !isAnimating;
}

// Function to reset the text transition
function resetTextTransition() {
    // Reset the lerpSlider value to 1, which represents the original shape
    lerpSlider.value(1);

    // Reset pathClone to match path
    if (path) {
        pathClone = JSON.parse(JSON.stringify(path));
        initializeNoiseOffsets(); // Reinitialize noise offsets
    }

    // Reset other settings
    currentText = 'HELLO';
    textScaleSlider.value(1);
    strokeWeightSlider.value(2);
    pointStrokeWeightSlider.value(2);
    backgroundOpacitySlider.value(255);
    textColorPicker.value('#ffffff');
    backgroundColorPicker.value('#000000');
    circlesCheckbox.checked(false);
    transitionCheckbox.checked(false);
    animateCheckbox.checked(false);
    isAnimating = false;
    input.value(currentText);

    // Update text display
    updateText();

    // Reset GUI styles and values
    guiHolder.style('display', 'block');
    inputGuiHolder.style('display', 'block');
    
    // Reset lerpSlider to default value
    lerpSlider.value(1);
}

// Add event listener for the background opacity slider
function setupBackgroundOpacitySlider() {
    backgroundOpacitySlider.input(function () {
        backgroundOpacity = this.value();
    });
}

// Function to export the canvas as an image
function exportImage() {
    saveCanvas('myCanvas', 'jpg');
}

// Function to update text/font color
function updateTextColor() {
    textColor = textColorPicker.value();
}

// Function to update background color
function updateBackgroundColor() {
    bgColor = backgroundColorPicker.value();
}

// Function to toggle the GUI visibility
function toggleGUI() {
    // Toggle the visibility of the GUI holder div
    if (guiHolder.style('display') === 'none') {
        guiHolder.style('display', 'block');
        this.html('Hide');
    } else {
        guiHolder.style('display', 'none');
        this.html('Show');
    }
}

// Function to toggle the Input GUI visibility
function toggleInputGUI() {
    // Toggle the visibility of the Input GUI holder div
    if (inputGuiHolder.style('display') === 'none') {
        inputGuiHolder.style('display', 'block');
        this.html('Hide');
    } else {
        inputGuiHolder.style('display', 'none');
        this.html('Show');
    }
}

// Function to handle the selected font file
function handleFile(file) {
    if (file.type === 'font') {
        fontPath = file.data;
        updateText();
    } else {
        alert('Please select a valid font file.');
    }
}

// Function to highlight the drop zone
function highlight() {
    dropZone.style('background-color', '#333');
}

// Function to unhighlight the drop zone
function unhighlight() {
    dropZone.style('background-color', '#000');
}

function exportAnimation() {
    if (!recording) {
        recording = true;
        recordStartFrame = frameCount;
        capturer = new CCapture({
            format: 'webm',
            framerate: 60
        });
        capturer.start();
        exportAnimationButton.html('Recording...');
    } else {
        recording = false;
        capturer.stop();
        capturer.save();
        exportAnimationButton.html('Export Animation');
    }
}

// Function to initialize noise offsets
function initializeNoiseOffsets() {
    noiseOffsetX = [];
    noiseOffsetY = [];
    for (let i = 0; i < pathClone.commands.length; i++) {
        noiseOffsetX.push(random(0, 1000));
        noiseOffsetY.push(random(0, 1000));
    }
}
