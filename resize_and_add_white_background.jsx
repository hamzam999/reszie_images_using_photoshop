// Create a new layer with a white background
function addWhiteBackground() {
    var whiteColor = new SolidColor();
    whiteColor.rgb.red = 255;
    whiteColor.rgb.green = 255;
    whiteColor.rgb.blue = 255;

    // Add a new layer filled with white
    var whiteBackgroundLayer = app.activeDocument.artLayers.add();
    whiteBackgroundLayer.name = "White Background";

    app.activeDocument.selection.selectAll();
    app.activeDocument.selection.fill(whiteColor);
}

// Create a copy of the background layer (for JPG and JPEG)
function createBackgroundCopy() {
    var backgroundLayer = app.activeDocument.backgroundLayer;

    // Duplicate the background layer
    var backgroundCopy = backgroundLayer.duplicate();
    backgroundCopy.name = "Background Copy";

    // Set the duplicate layer as the active layer
    app.activeDocument.activeLayer = backgroundCopy;

    return backgroundCopy;
}

// Move the current layer to the bottom
function moveLayerToBottom() {
    var docRef = app.activeDocument;
    docRef.artLayers[0].move(docRef.artLayers[docRef.artLayers.length - 1], ElementPlacement.PLACEBEFORE);
}

// Move the white background layer below the image layer for PNG
function moveWhiteBackgroundBelowImage() {
    var docRef = app.activeDocument;
    var whiteLayerIndex = 0; // Assuming the white background layer is at index 0

    docRef.artLayers[whiteLayerIndex].move(docRef.artLayers[docRef.artLayers.length - 1], ElementPlacement.PLACEAFTER);
}

// Set the resolution to fit within a target x target square canvas
function setResolution(target, originalExtension) {
    var targetSize = target;

    var currentWidth = app.activeDocument.width.value;
    var currentHeight = app.activeDocument.height.value;

    var aspectRatio = currentWidth / currentHeight;

    var newWidth, newHeight;

    if (currentWidth > currentHeight) {
        newWidth = targetSize;
        newHeight = targetSize / aspectRatio;
    } else {
        newWidth = targetSize * aspectRatio;
        newHeight = targetSize;
    }

    app.activeDocument.resizeImage(newWidth, newHeight, 300, ResampleMethod.BICUBIC);

    // Extend the canvas to target x target pixels
    app.activeDocument.resizeCanvas(target, target, AnchorPosition.MIDDLECENTER);

    // Add a new layer filled with white
    addWhiteBackground();

    if (originalExtension === 'png') {
        // Move the white background layer below the image layer for PNG
        moveWhiteBackgroundBelowImage();
    } else {
        // For JPG and JPEG, move the white background layer to the back
        moveLayerToBottom();
    }
}

// Extract original extension from the file name
function getOriginalExtension(fileName) {
    var lastDotIndex = fileName.lastIndexOf('.');
    return lastDotIndex !== -1 ? fileName.substring(lastDotIndex + 1) : '';
}

// Process and save each image
function processAndSaveImage(file, outputFolder, targetResolution) {
    app.open(file);
    var originalExtension = getOriginalExtension(app.activeDocument.name);

    // Create a copy of the background layer (for JPG and JPEG)
    if (originalExtension !== 'png') {
        var backgroundCopy = createBackgroundCopy();
    }

    // Set resolution, extend canvas, add white background, move to back
    setResolution(targetResolution, originalExtension);

    // Append "sqr" to the file name and add the original extension
    var fileName = app.activeDocument.name.replace(/\.[^\.]+$/, '');

    // Get the name of the selected folder
var selectedFolderName = outputFolder
    // Create a folder inside the selected folder
    var outputSubFolder = new Folder(outputFolder+"/"+'processedImages' + "_" + targetResolution+"X"+targetResolution);
    if (!outputSubFolder.exists) {
        outputSubFolder.create();
    }

    var outputFilePath = outputSubFolder + "/" + fileName +"_" +targetResolution+"x"+targetResolution+"." + originalExtension;

    // Save with original quality
    var options = new JPEGSaveOptions();
    options.quality = 12; // Maximum quality (adjust if needed)

    app.activeDocument.saveAs(new File(outputFilePath), options, true);
    app.activeDocument.close(SaveOptions.DONOTSAVECHANGES);

}

// Ask for folder path
function getFolderPath() {
    var folder = Folder.selectDialog("Select a folder of images");
    return folder;
}

// Ask for target resolution
function getTargetResolution() {
    var targetResolution = prompt("Enter the target resolution for square images (e.g., 2000):", "2000");
    return parseInt(targetResolution);
}

// Ask for target resolution (width and height)
function getTargetResolution1() {
    var input = prompt("Enter the target resolution (e.g., 2000 or 1200x800):", "2000");
    
    // Split the input by 'x' to get width and height
    var dimensions = input.split('x');
    
    if (dimensions.length === 1) {
        // If only one value is entered, assume it as square dimensions
        var size = parseInt(dimensions[0]);
        return { width: size, height: size };
    } else if (dimensions.length === 2) {
        // If both width and height are entered, use them
        var width = parseInt(dimensions[0]);
        var height = parseInt(dimensions[1]);
        
        return { width: width, height: height };
    } else {
        // Invalid input, return null
        return null;
    }
}

// Main function
function main() {
    var folder = getFolderPath();

    if (folder) {
        var targetResolution = getTargetResolution();
        if (isNaN(targetResolution) || targetResolution <= 0) {
            alert("Invalid target resolution. Please enter a valid positive number.");
            return;
        }

        var outputFolder = folder.fsName;
        var files = folder.getFiles(/\.(jpg|jpeg|png)$/i);

        if (files.length > 0) {
            for (var i = 0; i < files.length; i++) {
                processAndSaveImage(files[i], outputFolder, targetResolution);
            }
            alert("Script completed!");
        } else {
            alert("No image files found in the selected folder.");
        }
    }
}

// Run the main function
main();
