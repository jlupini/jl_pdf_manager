var convertShapeToHighlight, createHighlightFromAnnotation, debug, e, emphasisLayerSelected, error, getActivePageFile, getEmphasisProperties, getFullPDFTree, getPollingData, makeEmphasisLayer, openDocument, processRawAnnotationData, runLayoutCommand, setBlendingMode, setEmphasisProperties, toggleGuideLayers, transitionClearIn, transitionClearOut, transitionFadeIn, transitionFadeOut, transitionFadeScaleIn, transitionFadeScaleOut, transitionSlideIn, transitionSlideOut;

try {
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
      selectedLayer.effect(params.name).property("Color").setValue(params.color);
    }
    if (params.thickness != null) {
      selectedLayer.effect(params.name).property("Thickness").setValue(params.thickness);
    }
    if (params.lag != null) {
      return selectedLayer.effect(params.name).property("Lag").setValue(params.lag);
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
    app.beginUndoGroup("Set Blend Mode (via NF Panel)");
    if (mode === "overlay") {
      modeCode = BlendingMode.OVERLAY;
    } else if (mode === "multiply") {
      modeCode = BlendingMode.MULTIPLY;
    } else if (mode === "screen") {
      modeCode = BlendingMode.SCREEN;
    } else {
      modeCode = BlendingMode.NORMAL;
    }
    NFProject.selectedLayers().forEach((function(_this) {
      return function(layer) {
        return layer.$.blendingMode = modeCode;
      };
    })(this));
    return app.endUndoGroup();
  };
  runLayoutCommand = function(model) {
    var activeComp;
    app.beginUndoGroup("Run Layout Command");
    activeComp = NFProject.activeComp();
    activeComp.runLayoutCommand(model);
    return app.endUndoGroup();
  };
  getFullPDFTree = function() {
    var allPageComps, contentTree, j, k, key, len, len1, outputTree, pageComp, pageCompArr, pageLayers, pageNumber, pdfNumber, pdfObj, shapeLayers, thisPDF, thisPage;
    contentTree = {};
    outputTree = {
      pdfs: []
    };
    allPageComps = NFProject.allPageComps();
    for (j = 0, len = allPageComps.length; j < len; j++) {
      pageComp = allPageComps[j];
      pdfNumber = pageComp.getPDFNumber();
      if (contentTree[pdfNumber] == null) {
        contentTree[pdfNumber] = [];
      }
      contentTree[pdfNumber].push(pageComp);
    }
    for (key in contentTree) {
      pdfObj = NFPDF.fromPDFNumber(key);
      pageCompArr = contentTree[key];
      thisPDF = {
        id: key,
        type: "pdf",
        displayName: "PDF " + key,
        pages: []
      };
      for (k = 0, len1 = pageCompArr.length; k < len1; k++) {
        pageComp = pageCompArr[k];
        pageNumber = pageComp.getPageNumber();
        thisPage = {
          id: pageComp.getID(),
          type: "pageComp",
          pageNumber: pageNumber,
          displayName: "Page " + pageNumber,
          compName: pageComp.getName(),
          shapes: []
        };
        pageLayers = pageComp.allLayers();
        shapeLayers = new NFLayerCollection;
        pageLayers.forEach((function(_this) {
          return function(layer) {
            if (layer.$ instanceof ShapeLayer) {
              return shapeLayers.add(layer);
            }
          };
        })(this));
        if (!shapeLayers.isEmpty()) {
          shapeLayers.forEach((function(_this) {
            return function(shapeLayer) {
              var thisShape;
              thisShape = {
                type: "shape",
                layerName: shapeLayer.$.name
              };
              if (shapeLayer instanceof NFHighlightLayer) {
                thisShape.displayName = shapeLayer.$.name + " (HL)";
                thisShape.highlight = true;
              } else {
                thisShape.displayName = shapeLayer.$.name + " (Shape)";
                thisShape.highlight = false;
              }
              return thisPage.shapes.push(thisShape);
            };
          })(this));
        }
        thisPDF.pages.push(thisPage);
      }
      outputTree.pdfs.push(thisPDF);
    }
    return JSON.stringify(outputTree);
  };
  getPollingData = function() {
    var activeComp, compType, layerType, layerTypeString, model, selectedLayers;
    layerTypeString = function(layer) {
      var layerType;
      if (layer instanceof NFPageLayer) {
        return layerType = "page-layer";
      } else if (layer instanceof NFHighlightLayer) {
        return layerType = "highlight-layer";
      } else if (layer instanceof NFHighlightControlLayer) {
        return layerType = "highlight-control-layer";
      } else if (layer instanceof NFEmphasisLayer) {
        return layerType = "emphasis-layer";
      } else {
        return layerType = "misc-layer";
      }
    };
    model = {};
    activeComp = NFProject.activeComp();
    if (activeComp != null) {
      if (activeComp instanceof NFPageComp) {
        compType = "page-comp";
      } else if (activeComp instanceof NFPartComp) {
        compType = "part-comp";
      } else {
        compType = "misc-comp";
      }
      selectedLayers = NFProject.selectedLayers();
      if (selectedLayers.isEmpty()) {
        layerType = "no-layer";
      } else if (selectedLayers.count() === 1) {
        layerType = layerTypeString(selectedLayers.get(0));
      } else {
        layerType = "multiple-layers";
      }
      model.bodyClass = layerType + " " + compType;
      model.selectedLayers = [];
      selectedLayers.forEach((function(_this) {
        return function(layer) {
          return model.selectedLayers.push({
            name: layer.getName(),
            type: layerTypeString(layer)
          });
        };
      })(this));
      if (selectedLayers.count() === 1) {
        model.effects = [];
        selectedLayers.get(0).aeq().forEachEffect((function(_this) {
          return function(e, i) {
            if (e.matchName.indexOf("AV_") >= 0) {
              model.effects.push({
                name: e.name,
                matchName: e.matchName,
                properties: {}
              });
              return e.forEach(function(prop) {
                return model.effects[i - 1].properties[prop.name] = {
                  value: prop.value
                };
              });
            }
          };
        })(this));
      }
    } else {
      model.bodyClass = "no-comp";
    }
    return JSON.stringify(model);
  };
  getActivePageFile = function() {
    var activeComp;
    activeComp = NFProject.activeComp();
    if (activeComp instanceof NFPageComp && (activeComp.getPDFLayer().$.source != null)) {
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
} catch (error) {
  e = error;
  alert(e);
}
