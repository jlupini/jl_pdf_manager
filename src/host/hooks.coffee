openDocument = (location) ->
  alert 'Testing server'
  fileRef = new File(location)
  docRef = app.open(fileRef)
  return

debug = () ->
  $.level = 2
  debugger

getCompAndLayerType = ->
  activeComp = NFProject.activeComp()
  selectedLayers = NFProject.selectedLayers()

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
    else layerType = "misc-layer"
  else layerType = "multiple-layers"

  # retObj =
  #   compType: compType
  #   layerType: layerType
  return "#{layerType} #{compType}"

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
