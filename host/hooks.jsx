var convertShapeToHighlight, createHighlightFromAnnotation, debug, getActivePageFile, getCompName, openDocument, processRawAnnotationData, toggleGuideLayers;

openDocument = function(location) {
  var docRef, fileRef;
  alert('Testing server');
  fileRef = new File(location);
  docRef = app.open(fileRef);
};

debug = function() {
  $.level = 2;
  debugger;
};

getCompName = function() {
  return NFProject.activeComp().getName();
};

getActivePageFile = function() {
  var activeComp;
  activeComp = NFProject.activeComp();
  if (activeComp instanceof NFPageComp) {
    return activeComp.getPDFLayer().$.source.file.fsName;
  } else {
    return null;
  }
};

processRawAnnotationData = function(rawData) {
  return NFPDFManager.processRawAnnotationData(rawData);
};

toggleGuideLayers = function() {
  return NFProject.toggleGuideLayers();
};

convertShapeToHighlight = function() {
  var key, lineCount, newColor, newName, ref, ref1, selectedLayer, testColor;
  app.beginUndoGroup("Convert Shape to Highlight");
  selectedLayer = (ref = NFProject.selectedLayers()) != null ? ref.get(0) : void 0;
  if (!((selectedLayer != null) && selectedLayer instanceof NFShapeLayer)) {
    return alert("No Valid Shape Layer Selected");
  }
  lineCount = parseInt(prompt('How many initial highlight lines would you like to create?'));
  newName = selectedLayer.getName().replace("Imported PDF Shape: ", "");
  ref1 = NFHighlightLayer.COLOR;
  for (key in ref1) {
    testColor = ref1[key];
    if (newName.indexOf(testColor.str) >= 0) {
      newColor = testColor;
    }
  }
  selectedLayer.containingComp().createHighlight({
    shapeLayer: selectedLayer,
    lines: lineCount,
    name: newName,
    color: newColor != null ? newColor : NFHighlightLayer.COLOR.YELLOW
  });
  selectedLayer.remove();
  return app.endUndoGroup();
};

createHighlightFromAnnotation = function(annotationDataString) {
  var annotData, annotationLayer, key, newColor, ref, targetComp, testColor;
  app.beginUndoGroup("Create Highlight from Annotation");
  annotData = JSON.parse(annotationDataString);
  targetComp = NFProject.activeComp();
  annotationLayer = targetComp.addShapeLayer();
  annotationLayer.addRectangle({
    fillColor: annotData.color,
    rect: annotData.rect
  });
  annotationLayer.transform().scale.setValue(targetComp != null ? targetComp.getPDFLayer().transform().scale.value : void 0);
  if (annotData.lineCount === 0) {
    annotationLayer.transform("Opacity").setValue(20);
    annotationLayer.setName("Imported PDF Shape: " + annotData.cleanName);
  } else {
    ref = NFHighlightLayer.COLOR;
    for (key in ref) {
      testColor = ref[key];
      if (annotData.colorName.indexOf(testColor.str) >= 0) {
        newColor = testColor;
      }
    }
    targetComp.createHighlight({
      shapeLayer: annotationLayer,
      lines: annotData.lineCount,
      name: annotData.cleanName,
      color: newColor
    });
    annotationLayer.remove();
  }
  return app.endUndoGroup();
};
