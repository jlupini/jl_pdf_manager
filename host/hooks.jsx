var convertShapeToHighlight, createHighlightFromAnnotation, debug, emphasisLayerSelected, getActivePageFile, getCompAndLayerType, getEmphasisProperties, getPollingData, makeEmphasisLayer, openDocument, processRawAnnotationData, setBlendingMode, setEmphasisProperties, toggleGuideLayers, transitionClearIn, transitionClearOut, transitionFadeIn, transitionFadeOut, transitionFadeScaleIn, transitionFadeScaleOut, transitionSlideIn, transitionSlideOut;

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

makeEmphasisLayer = function() {
  var selectedLayer;
  selectedLayer = NFProject.singleSelectedLayer();
  if (selectedLayer == null) {
    return alert("Please select a single layer first");
  }
  return selectedLayer.addEmphasisLayer();
};

emphasisLayerSelected = function() {
  var selectedLayer;
  selectedLayer = NFProject.singleSelectedLayer();
  return (selectedLayer != null) && selectedLayer instanceof NFEmphasisLayer;
};

setEmphasisProperties = function(paramsJSON) {
  var params, selectedLayer;
  selectedLayer = NFProject.singleSelectedLayer();
  if (selectedLayer == null) {
    return alert("Please select a single emphasis layer");
  }
  params = JSON.parse(paramsJSON);
  if (params.name == null) {
    return alert("Error - no cylon specified");
  }
  if (params.color != null) {
    return selectedLayer.effect(params.name).property("Color").setValue(params.color);
  }
};

getEmphasisProperties = function() {
  var allEffects, layer, selectedLayer;
  selectedLayer = NFProject.singleSelectedLayer();
  if (selectedLayer == null) {
    return alert("Please select a single layer first");
  }
  allEffects = {};
  layer = new aeq.Layer(selectedLayer.$);
  layer.forEachEffect(function(e) {
    return allEffects[e.name] = {
      thickness: e.property("Thickness").value,
      lag: e.property("Lag").value,
      color: e.property("Color").value
    };
  });
  return allEffects;
};

transitionFadeIn = function() {
  var theLayer;
  theLayer = NFProject.singleSelectedLayer();
  if (theLayer == null) {
    return alert("Please select a single layer first");
  }
  return theLayer.fadeIn();
};

transitionFadeOut = function() {
  var theLayer;
  theLayer = NFProject.singleSelectedLayer();
  if (theLayer == null) {
    return alert("Please select a single layer first");
  }
  return theLayer.fadeOut();
};

transitionSlideIn = function() {
  var theLayer;
  theLayer = NFProject.singleSelectedLayer();
  if (theLayer == null) {
    return alert("Please select a single layer first");
  }
  return theLayer.slideIn();
};

transitionSlideOut = function() {
  var theLayer;
  theLayer = NFProject.singleSelectedLayer();
  if (theLayer == null) {
    return alert("Please select a single layer first");
  }
  return theLayer.slideOut();
};

transitionClearIn = function() {
  var theLayer;
  theLayer = NFProject.singleSelectedLayer();
  alert("deleting in and out NF transitions");
  if (theLayer == null) {
    return alert("Please select a single layer first");
  }
  return theLayer.removeNFMarkers();
};

transitionClearOut = function() {
  var theLayer;
  theLayer = NFProject.singleSelectedLayer();
  alert("deleting in and out NF transitions");
  if (theLayer == null) {
    return alert("Please select a single layer first");
  }
  return theLayer.removeNFMarkers();
};

transitionFadeScaleIn = function() {
  return alert("haven't done this yet");
};

transitionFadeScaleOut = function() {
  return alert("haven't done this yet");
};

setBlendingMode = function(mode) {
  var modeCode;
  if (mode === "overlay") {
    modeCode = BlendingMode.OVERLAY;
  } else if (mode === "multiply") {
    modeCode = BlendingMode.MULTIPLY;
  } else if (mode === "screen") {
    modeCode = BlendingMode.SCREEN;
  } else {
    modeCode = BlendingMode.NORMAL;
  }
  return NFProject.selectedLayers().forEach((function(_this) {
    return function(layer) {
      return layer.$.blendingMode = modeCode;
    };
  })(this));
};

getPollingData = function() {
  var activeComp, compType, layerType, model, selectedLayers, singleLayer;
  model = {};
  activeComp = NFProject.activeComp();
  selectedLayers = NFProject.selectedLayers();
  if (activeComp instanceof NFPageComp) {
    compType = "page-comp";
  } else if (activeComp instanceof NFPartComp) {
    compType = "part-comp";
  } else {
    compType = "misc-comp";
  }
  if (selectedLayers.isEmpty()) {
    layerType = "no-layer";
  } else if (selectedLayers.count() === 1) {
    singleLayer = selectedLayers.get(0);
    if (singleLayer instanceof NFPageLayer) {
      layerType = "page-layer";
    } else if (singleLayer instanceof NFHighlightLayer) {
      layerType = "highlight-layer";
    } else if (singleLayer instanceof NFHighlightControlLayer) {
      layerType = "highlight-control-layer";
    } else if (singleLayer instanceof NFEmphasisLayer) {
      layerType = "emphasis-layer";
    } else {
      layerType = "misc-layer";
    }
  } else {
    layerType = "multiple-layers";
  }
  model.bodyClass = layerType + " " + compType;
  model.selectedLayers = [];
  selectedLayers.forEach((function(_this) {
    return function(layer) {
      return model.selectedLayers.push(layer.getName());
    };
  })(this));
  if (selectedLayers.count() === 1) {
    model.effects = {};
    singleLayer.aeq().forEachEffect((function(_this) {
      return function(e) {
        model.effects[e.name] = {};
        if (e.matchName.indexOf("AV_") >= 0) {
          return e.forEach(function(prop) {
            return model.effects[e.name][prop.name] = [prop.value];
          });
        }
      };
    })(this));
  }
  return JSON.stringify(model);
};

getCompAndLayerType = function() {
  var activeComp, compType, layerType, selectedLayers, singleLayer;
  activeComp = NFProject.activeComp();
  selectedLayers = NFProject.selectedLayers();
  if (activeComp instanceof NFPageComp) {
    compType = "page-comp";
  } else if (activeComp instanceof NFPartComp) {
    compType = "part-comp";
  } else {
    compType = "misc-comp";
  }
  if (selectedLayers.isEmpty()) {
    layerType = "no-layer";
  } else {
    if (selectedLayers.count() === 1) {
      singleLayer = selectedLayers.get(0);
      if (singleLayer instanceof NFPageLayer) {
        layerType = "page-layer";
      } else if (singleLayer instanceof NFHighlightLayer) {
        layerType = "highlight-layer";
      } else if (singleLayer instanceof NFHighlightControlLayer) {
        layerType = "highlight-control-layer";
      } else if (singleLayer instanceof NFEmphasisLayer) {
        layerType = "emphasis-layer";
      } else {
        layerType = "misc-layer";
      }
    } else {
      layerType = "multiple-layers";
    }
  }
  return layerType + " " + compType;
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
