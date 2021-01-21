var convertShapeToHighlight, createHighlightFromAnnotation, debug, e, emphasisLayerSelected, error, focusOn, getActivePageFile, getEmphasisProperties, getFullPDFTree, getPollingData, makeEmphasisLayer, openDocument, processRawAnnotationData, runLayoutCommand, setBlendingMode, setEmphasisProperties, toggleGuideLayers, transitionClearIn, transitionClearOut, transitionFadeIn, transitionFadeOut, transitionFadeScaleIn, transitionFadeScaleOut, transitionSlideIn, transitionSlideOut;

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
  focusOn = function(req) {
    var activeComp, activeLayers, looseLayers, tightLayers;
    app.beginUndoGroup("Change Focus (via NF Panel)");
    if (req === "all") {
      NFProject.activeComp().allLayers().forEach((function(_this) {
        return function(layer) {
          if (!(layer.getName().indexOf("FlightPath") >= 0)) {
            return layer.setShy(false);
          }
        };
      })(this));
      NFProject.activeComp().$.hideShyLayers = true;
    } else if (req === "pdf") {
      activeComp = NFProject.activeComp();
      activeLayers = activeComp.activeLayers();
      if (activeLayers.isEmpty()) {
        return alert("No layers active!");
      }
      looseLayers = new NFLayerCollection;
      activeLayers.forEach((function(_this) {
        return function(layer) {
          var group;
          if (!(layer instanceof NFCitationLayer || layer.getName().indexOf("Backing for") >= 0)) {
            looseLayers.add(layer);
          }
          if (!layer.is(activeComp.greenscreenLayer())) {
            looseLayers.add(layer.getChildren(true));
          }
          if (layer instanceof NFPageLayer) {
            group = layer.getPaperLayerGroup();
            if (group != null) {
              looseLayers.add(group.getMembers());
              return looseLayers.add(group.paperParent);
            }
          }
        };
      })(this));
      activeComp.allLayers().forEach((function(_this) {
        return function(layer) {
          return layer.setShy(!looseLayers.containsLayer(layer));
        };
      })(this));
      activeComp.$.hideShyLayers = true;
    } else if (req === "active") {
      activeComp = NFProject.activeComp();
      activeLayers = activeComp.activeLayers();
      if (activeLayers.isEmpty()) {
        return alert("No layers active!");
      }
      tightLayers = new NFLayerCollection;
      activeLayers.forEach((function(_this) {
        return function(layer) {
          var group, time;
          if (!(layer instanceof NFCitationLayer || layer.getName().indexOf("Backing for") >= 0)) {
            tightLayers.add(layer);
          }
          if (layer instanceof NFPageLayer) {
            group = layer.getPaperLayerGroup();
            if (group != null) {
              tightLayers.add(group.paperParent);
              tightLayers.add(group.getCitationLayer());
              time = activeComp.getTime();
              return group.getControlLayers().forEach(function(control) {
                if (control.$.inPoint <= time && control.$.outPoint >= time) {
                  return tightLayers.add(control);
                }
              });
            }
          }
        };
      })(this));
      activeComp.allLayers().forEach((function(_this) {
        return function(layer) {
          return layer.setShy(!tightLayers.containsLayer(layer));
        };
      })(this));
      activeComp.$.hideShyLayers = true;
    } else {
      alert("Error: Invalid focus request");
    }
    return app.endUndoGroup();
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
    var activeComp, e, error;
    try {
      app.beginUndoGroup("Run Layout Command");
      activeComp = NFProject.activeComp();
      activeComp.runLayoutCommand(model);
      return app.endUndoGroup();
    } catch (error) {
      e = error;
      return alert("Error calling hook `runLayoutCommand`: " + e.message);
    }
  };
  getFullPDFTree = function() {
    var allPageComps, contentTree, e, error, j, k, key, len, len1, outputTree, pageComp, pageCompArr, pageLayers, pdfNumber, shapeLayers, thisPDF, thisPage;
    try {
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
        thisPDF = NFPDF.fromPDFNumber(key).simplify();
        thisPDF.pages = [];
        pageCompArr = contentTree[key];
        for (k = 0, len1 = pageCompArr.length; k < len1; k++) {
          pageComp = pageCompArr[k];
          thisPage = pageComp.simplify();
          thisPage.shapes = [];
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
                return thisPage.shapes.push(shapeLayer.simplify());
              };
            })(this));
          }
          thisPDF.pages.push(thisPage);
        }
        outputTree.pdfs.push(thisPDF);
      }
      return JSON.stringify(outputTree);
    } catch (error) {
      e = error;
      return e;
    }
  };
  getPollingData = function() {
    var activeComp, activePage, aeqLayer, allLayers, compType, e, error, i, j, k, layerType, model, prevLayer, ref, ref1, ref2, selectedAVLayers, selectedLayer, simpLayer, singleSelectedLayerSimplified, thisLayer;
    try {
      model = {};
      activeComp = app.project.activeItem;
      if (activeComp != null) {
        compType = activeComp.simpleReflection()["class"];
        if (compType === "NFPartComp") {
          activePage = null;
          allLayers = activeComp.layers;
          if (allLayers.length !== 0) {
            prevLayer = null;
            for (i = j = 1, ref = allLayers.length; 1 <= ref ? j <= ref : j >= ref; i = 1 <= ref ? ++j : --j) {
              thisLayer = allLayers[i];
              if (((ref1 = thisLayer.source) != null ? ref1.name.indexOf("NFPage") : void 0) >= 0 && thisLayer.name.indexOf('[ref]') < 0 && thisLayer.opacity.value !== 0) {
                if (prevLayer != null) {
                  if (thisLayer.index < prevLayer.index) {
                    activePage = thisLayer;
                  }
                } else {
                  activePage = thisLayer;
                }
                prevLayer = thisLayer;
              }
            }
          }
          if (activePage != null) {
            model.activePDF = activePage.source.getPDFNumber();
            model.activePage = activePage.simpleReflection();
          }
        }
        selectedAVLayers = app.project.activeItem.selectedLayers;
        if (selectedAVLayers.length === 0) {
          layerType = "no-layer";
        } else if (selectedAVLayers.length === 1) {
          selectedLayer = selectedAVLayers[0];
          singleSelectedLayerSimplified = selectedLayer.simpleReflection();
          layerType = singleSelectedLayerSimplified["class"];
          model.effects = [];
          aeqLayer = new aeq.Layer(selectedLayer);
          aeqLayer.forEachEffect((function(_this) {
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
        } else {
          layerType = "multiple-layers";
        }
        model.selectedLayers = [];
        if (singleSelectedLayerSimplified != null) {
          model.selectedLayers.push(singleSelectedLayerSimplified);
        } else if (selectedAVLayers.length > 0) {
          for (i = k = 0, ref2 = selectedAVLayers.length - 1; 0 <= ref2 ? k <= ref2 : k >= ref2; i = 0 <= ref2 ? ++k : --k) {
            simpLayer = selectedAVLayers[i].simpleReflection();
            model.selectedLayers.push(simpLayer);
          }
        }
        model.bodyClass = layerType + " " + compType;
      } else {
        model.bodyClass = "no-comp";
      }
      return JSON.stringify(model);
    } catch (error) {
      e = error;
      return alert("Error calling hook `getPollingData`: " + e.message);
    }
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
