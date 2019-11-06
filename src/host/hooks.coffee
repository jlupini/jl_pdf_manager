openDocument = (location) ->
  alert 'Testing server'
  fileRef = new File(location)
  docRef = app.open(fileRef)
  return

debug = () ->
  $.level = 2
  debugger

getCompName = ->
  return NFProject.activeComp().getName()

getActivePage = ->
  activeComp = NFProject.activeComp()
  if activeComp instanceof NFPageComp
    return activeComp.getPDFLayer().layer.source.file.fsName
  else return null

processRawAnnotationData = (rawData) ->
  return NFPDFManager.processRawAnnotationData rawData

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
