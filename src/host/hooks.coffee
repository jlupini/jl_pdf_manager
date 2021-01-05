try
  openDocument = (location) ->
    alert 'Testing server'
    fileRef = new File(location)
    docRef = app.open(fileRef)
    return

  debug = () ->
    $.level = 2
    debugger

  #
  # Emphasizer
  #
  makeEmphasisLayer = ->
    selectedLayer = NFProject.singleSelectedLayer()
    return alert "Please select a single layer first" unless selectedLayer?
    selectedLayer.addEmphasisLayer()

  emphasisLayerSelected = ->
    selectedLayer = NFProject.singleSelectedLayer()
    return selectedLayer? and selectedLayer instanceof NFEmphasisLayer

  setEmphasisProperties = (paramsJSON) ->
    selectedLayer = NFProject.singleSelectedLayer()
    return alert "Please select a single emphasis layer" unless selectedLayer?

    params = JSON.parse paramsJSON
    return alert "Error - no cylon specified" unless params.name?

    if params.color?
      selectedLayer.effect(params.name).property("Color").setValue params.color
    if params.thickness?
      selectedLayer.effect(params.name).property("Thickness").setValue params.thickness
    if params.lag?
      selectedLayer.effect(params.name).property("Lag").setValue params.lag

  getEmphasisProperties = ->
    selectedLayer = NFProject.singleSelectedLayer()
    return alert "Please select a single layer first" unless selectedLayer?

    allEffects = {}
    # Using aequery for the first time
    layer = new aeq.Layer (selectedLayer.$)
    layer.forEachEffect (e) ->
      allEffects[e.name] =
        thickness: e.property("Thickness").value
        lag: e.property("Lag").value
        color: e.property("Color").value
    return allEffects


  #
  # Transition Stuff
  #
  transitionFadeIn = ->
    theLayer = NFProject.singleSelectedLayer()
    return alert "Please select a single layer first" unless theLayer?
    theLayer.fadeIn()
  transitionFadeOut = ->
    theLayer = NFProject.singleSelectedLayer()
    return alert "Please select a single layer first" unless theLayer?
    theLayer.fadeOut()
  transitionSlideIn = ->
    theLayer = NFProject.singleSelectedLayer()
    return alert "Please select a single layer first" unless theLayer?
    theLayer.slideIn()
  transitionSlideOut = ->
    theLayer = NFProject.singleSelectedLayer()
    return alert "Please select a single layer first" unless theLayer?
    theLayer.slideOut()
  transitionClearIn = ->
    theLayer = NFProject.singleSelectedLayer()
    alert "deleting in and out NF transitions"
    return alert "Please select a single layer first" unless theLayer?
    theLayer.removeNFMarkers()
  transitionClearOut = ->
    theLayer = NFProject.singleSelectedLayer()
    alert "deleting in and out NF transitions"
    return alert "Please select a single layer first" unless theLayer?
    theLayer.removeNFMarkers()
  transitionFadeScaleIn = ->
    alert "haven't done this yet"
  transitionFadeScaleOut = ->
    alert "haven't done this yet"

  setBlendingMode = (mode) ->
    if mode is "overlay"
      modeCode = BlendingMode.OVERLAY
    else if mode is "multiply"
      modeCode = BlendingMode.MULTIPLY
    else if mode is "screen"
      modeCode = BlendingMode.SCREEN
    else
      modeCode = BlendingMode.NORMAL

    NFProject.selectedLayers().forEach (layer) =>
      layer.$.blendingMode = modeCode

  getPollingData = ->
    model = {}

    activeComp = NFProject.activeComp()
    selectedLayers = NFProject.selectedLayers()

    # Body Classes
    if activeComp instanceof NFPageComp
      compType = "page-comp"
    else if activeComp instanceof NFPartComp
      compType = "part-comp"
    else compType = "misc-comp"

    if selectedLayers.isEmpty()
      layerType = "no-layer"
    else if selectedLayers.count() is 1
      singleLayer = selectedLayers.get(0)
      if singleLayer instanceof NFPageLayer
        layerType = "page-layer"
      else if singleLayer instanceof NFHighlightLayer
        layerType = "highlight-layer"
      else if singleLayer instanceof NFHighlightControlLayer
        layerType = "highlight-control-layer"
      else if singleLayer instanceof NFEmphasisLayer
        layerType = "emphasis-layer"
      else layerType = "misc-layer"
    else layerType = "multiple-layers"

    model.bodyClass = "#{layerType} #{compType}"

    # Selected Layer Names
    model.selectedLayers = []
    selectedLayers.forEach (layer) =>
      model.selectedLayers.push layer.getName()

    # Single Layer Effects
    if selectedLayers.count() is 1
      model.effects = []
      # Using aequery for the first time
      singleLayer.aeq().forEachEffect (e, i) =>
        if e.matchName.indexOf("AV_") >= 0
          # $.bp()
          model.effects.push
            name: e.name
            matchName: e.matchName
            properties: {}
          e.forEach (prop) =>
            model.effects[i-1].properties[prop.name] =
              value: prop.value


    return JSON.stringify model

  getActivePageFile = ->
    activeComp = NFProject.activeComp()
    if activeComp instanceof NFPageComp
      return activeComp.getPDFLayer().$.source.file.fsName
    else return null

  processRawAnnotationData = (rawData) ->
    return NFPDFManager.processRawAnnotationData rawData

  toggleGuideLayers = () ->
    NFProject.toggleGuideLayers()

  convertShapeToHighlight = () ->
    app.beginUndoGroup "Convert Shape to Highlight"

    selectedLayer = NFProject.selectedLayers()?.get(0)
    return alert "No Valid Shape Layer Selected" unless selectedLayer? and selectedLayer instanceof NFShapeLayer
    lineCount = parseInt prompt('How many initial highlight lines would you like to create?')
    # Create the highlight effect
    newName = selectedLayer.getName().replace("Imported PDF Shape: ", "")
    for key, testColor of NFHighlightLayer.COLOR
      newColor = testColor if newName.indexOf(testColor.str) >= 0
    selectedLayer.containingComp().createHighlight
      shapeLayer: selectedLayer
      lines: lineCount
      name: newName
      color: newColor ? NFHighlightLayer.COLOR.YELLOW


    selectedLayer.remove()

    app.endUndoGroup()

  createHighlightFromAnnotation = (annotationDataString) ->
    app.beginUndoGroup "Create Highlight from Annotation"

    annotData = JSON.parse annotationDataString

    targetComp = NFProject.activeComp()

    # Actually add the shapes and stuff
    annotationLayer = targetComp.addShapeLayer()
    annotationLayer.addRectangle
      fillColor: annotData.color
      rect: annotData.rect

    annotationLayer.transform().scale.setValue targetComp?.getPDFLayer().transform().scale.value

    if annotData.lineCount is 0
      annotationLayer.transform("Opacity").setValue 20
      annotationLayer.setName "Imported PDF Shape: #{annotData.cleanName}"
    else
      for key, testColor of NFHighlightLayer.COLOR
        newColor = testColor if annotData.colorName.indexOf(testColor.str) >= 0

      # Create the highlight effect
      targetComp.createHighlight
        shapeLayer: annotationLayer
        lines: annotData.lineCount
        name: annotData.cleanName
        color: newColor

      annotationLayer.remove()

    app.endUndoGroup()
catch e
  alert e
