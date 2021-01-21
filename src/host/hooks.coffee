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

  focusOn = (req) ->
    app.beginUndoGroup "Change Focus (via NF Panel)"

    if req is "all"
      NFProject.activeComp().allLayers().forEach (layer) =>
        layer.setShy no unless layer.getName().indexOf("FlightPath") >= 0

      NFProject.activeComp().$.hideShyLayers = yes
    else if req is "pdf"
      activeComp = NFProject.activeComp()
      activeLayers = activeComp.activeLayers()
      return alert "No layers active!" if activeLayers.isEmpty()

      looseLayers = new NFLayerCollection
      activeLayers.forEach (layer) =>
        looseLayers.add layer unless layer instanceof NFCitationLayer or layer.getName().indexOf("Backing for") >= 0
        looseLayers.add layer.getChildren(yes) unless layer.is activeComp.greenscreenLayer()

        # Add members in PDF group if we can find one
        if layer instanceof NFPageLayer
          group = layer.getPaperLayerGroup()
          if group?
            looseLayers.add group.getMembers()
            looseLayers.add group.paperParent

      activeComp.allLayers().forEach (layer) =>
        layer.setShy not looseLayers.containsLayer(layer)

      activeComp.$.hideShyLayers = yes
    else if req is "active"
      activeComp = NFProject.activeComp()
      activeLayers = activeComp.activeLayers()
      return alert "No layers active!" if activeLayers.isEmpty()

      tightLayers = new NFLayerCollection
      activeLayers.forEach (layer) =>
        tightLayers.add layer unless layer instanceof NFCitationLayer or layer.getName().indexOf("Backing for") >= 0
        if layer instanceof NFPageLayer
          group = layer.getPaperLayerGroup()
          if group?
            tightLayers.add group.paperParent
            tightLayers.add group.getCitationLayer()

            time = activeComp.getTime()
            group.getControlLayers().forEach (control) =>
              tightLayers.add control if control.$.inPoint <= time and control.$.outPoint >= time

      activeComp.allLayers().forEach (layer) =>
        layer.setShy not tightLayers.containsLayer(layer)

      activeComp.$.hideShyLayers = yes
    else alert "Error: Invalid focus request"

    app.endUndoGroup()

  setBlendingMode = (mode) ->
    app.beginUndoGroup "Set Blend Mode (via NF Panel)"
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
    app.endUndoGroup()

  runLayoutCommand = (model) ->
    try
      # alert "start"
      app.beginUndoGroup "Run Layout Command"
      activeComp = NFProject.activeComp()
      activeComp.runLayoutCommand model
      app.endUndoGroup()
      # alert "finished fine"
    catch e
      alert "Error calling hook `runLayoutCommand`: #{e.message}"
    # alert "after hook tcb"

  getFullPDFTree = ->
    # Make an object with all the PDFs
    try
      contentTree = {}
      outputTree =
        pdfs: []
      allPageComps = NFProject.allPageComps()

      for pageComp in allPageComps
        pdfNumber = pageComp.getPDFNumber()

        contentTree[pdfNumber] = [] unless contentTree[pdfNumber]?
        contentTree[pdfNumber].push pageComp

      for key of contentTree
        thisPDF = NFPDF.fromPDFNumber(key).simplify()
        thisPDF.pages = []

        pageCompArr = contentTree[key]
        for pageComp in pageCompArr
          thisPage = pageComp.simplify()
          thisPage.shapes = []

          # Collect only the shape layers
          pageLayers = pageComp.allLayers()
          shapeLayers = new NFLayerCollection
          pageLayers.forEach (layer) =>
            shapeLayers.add layer if layer.$ instanceof ShapeLayer

          unless shapeLayers.isEmpty()
            shapeLayers.forEach (shapeLayer) =>
              thisPage.shapes.push shapeLayer.simplify()

          thisPDF.pages.push thisPage

        outputTree.pdfs.push thisPDF

      return JSON.stringify outputTree
    catch e
      return e


  getPollingData = ->
    # NOTE: We use native objects here to speed up polling
    try
      model = {}
      activeComp = app.project.activeItem
      if activeComp?
        compType = activeComp.simpleReflection().class

        if compType is "NFPartComp"
          # check for active page and PDF
          activePage = null
          allLayers = activeComp.layers
          unless allLayers.length is 0
            prevLayer = null
            for i in [1..(allLayers.length)]
              thisLayer = allLayers[i]
              if thisLayer.source?.name.indexOf("NFPage") >= 0 and thisLayer.name.indexOf('[ref]') < 0 and thisLayer.opacity.value isnt 0
                if prevLayer?
                  if thisLayer.index < prevLayer.index
                    activePage = thisLayer
                else
                  activePage = thisLayer
                prevLayer = thisLayer

          if activePage?
            model.activePDF = activePage.source.getPDFNumber()
            model.activePage = activePage.simpleReflection()

        selectedAVLayers = app.project.activeItem.selectedLayers
        if selectedAVLayers.length is 0
          layerType = "no-layer"
        else if selectedAVLayers.length is 1
          selectedLayer = selectedAVLayers[0]
          singleSelectedLayerSimplified = selectedLayer.simpleReflection()
          layerType = singleSelectedLayerSimplified.class


          #Add the FX
          model.effects = []
          # Using aequery for the first time
          aeqLayer = new aeq.Layer selectedLayer
          aeqLayer.forEachEffect (e, i) =>
            if e.matchName.indexOf("AV_") >= 0
              # $.bp()
              model.effects.push
                name: e.name
                matchName: e.matchName
                properties: {}
              e.forEach (prop) =>
                model.effects[i-1].properties[prop.name] =
                  value: prop.value

        else layerType = "multiple-layers"

        # Selected Layer Names
        model.selectedLayers = []
        if singleSelectedLayerSimplified?
          model.selectedLayers.push singleSelectedLayerSimplified
        else if selectedAVLayers.length > 0
          for i in [0..(selectedAVLayers.length-1)]
            simpLayer = selectedAVLayers[i].simpleReflection()
            model.selectedLayers.push simpLayer

        model.bodyClass = "#{layerType} #{compType}"

      else
        model.bodyClass = "no-comp"

      return JSON.stringify model
    catch e
      alert "Error calling hook `getPollingData`: #{e.message}"

  getActivePageFile = ->
    activeComp = NFProject.activeComp()
    if activeComp instanceof NFPageComp and activeComp.getPDFLayer().$.source?
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
