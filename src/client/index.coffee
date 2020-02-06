$(document).ready ->

  #
  # CSInterface Work
  #
  csInterface = new CSInterface
  csInterface.requestOpenExtension 'com.my.localserver', ''
  hook = (hookString, callback = null) ->
    csInterface.evalScript hookString, callback

  # Let Keystrokes through
  # OSVersion = csInterface.getOSInformation()
  # if OSVersion.indexOf("Windows") >= 0
  #   csInterface.registerKeyEventsInterest keyEventsInterest.win
  # else if OSVersion.indexOf("Mac") >= 0
  #   csInterface.registerKeyEventsInterest keyEventsInterest.mac

  # csInterface.addEventListener "documentAfterSave", (event) ->
  #   obj = event.data
  #   console.log(event)

  #
  # Load NF Libs
  #

  hook "$.evalFile($.includePath + '/../lib/nf_tools/nf-scripts/build/runtimeLibraries.jsx')"


  #
  # Global Vars
  #
  latestAnnotationData = {}
  smartTimer = null

  # Debug Vars
  timerCounter = 0

  #
  # Helper Functions
  #
  rgbToHex = (r, g, b) ->
    componentToHex = (c) ->
      hex = c.toString(16)
      if hex.length == 1 then '0' + hex else hex

    if r.length is 3
      b = r[2]
      g = r[1]
      r = r[0]
    '#' + componentToHex(r) + componentToHex(g) + componentToHex(b)


  getPageAnnotations = ->
    disp = $("#annotation-display")
    annotationDate = new Date()
    console.log "getPageAnnotations()"
    hook "app.project", (res) ->
      if res?
        hook "getActivePageFile()", (result) ->
          console.log "annotation hook returned - #{new Date() - annotationDate}ms"
          console.log result
          if result isnt "null"
            url = 'http://localhost:3200/annotationData'
            $.ajax
              type: 'GET'
              url: url
              data: filepath: result
              success: (response) ->
                # Don't bother doing anything if there's no change
                if JSON.stringify(response) is JSON.stringify(latestAnnotationData)
                  # console.log "no change to data"
                else
                  # console.log "data changed - updating"
                  # console.log response
                  latestAnnotationData = response
                  disp.empty()
                  if response.length is 0
                    disp.append "<p class='no-annotations-found'>No annotations found in this PDF</p>"
                  else
                    for annotation, i in response
                      dispID = "annotation-#{i}"
                      colorClassName = annotation.colorName.replace(/\s+/g, '-').toLowerCase()
                      disp.append "<li id='#{dispID}' class='annotation-item #{colorClassName}'></li>"
                      dispElement = $("##{dispID}")
                      dispElement.append "<div class='clean-name'>#{annotation.cleanName}</div>
                                          <div class='highlight-text'>#{annotation.text}</div>"
                      annotationDataString = JSON.stringify annotation
                      dispElement.click {param: annotationDataString}, (e) ->
                        hook "createHighlightFromAnnotation('#{e.data.param}')"
              error: (jqXHR, textStatus, errorThrown) ->
                console.log "Error: #{errorThrown}, #{jqXHR.responseJSON}"
                disp.empty()
                disp.append "<p class='error-thrown'>The PDF Server returned an error. 🤷Talk to Jesse...</p>"
                latestAnnotationData = {}
          else
            disp.empty()
            disp.append "<p class='no-active-page'>No active page</p>"
            latestAnnotationData = {}
      else
        disp.empty()
        disp.append "<p class='no-active-project'>No active project</p>"
        latestAnnotationData = {}

  compLayerType = ""
  checkForUpdates = ->
    if timerCounter >= 60
      console.log "threshold reached - stopping smart updates"
      timerCounter = 0
      $('#smart-toggle').click()
    else
      startInterval = new Date()
      console.log "polling (#{timerCounter})..."
      hook "getCompAndLayerType()", (res) ->
        console.log "hook returned (#{timerCounter}) - #{new Date() - startInterval}ms"
        if compLayerType isnt res
          compLayerType = res
          $("body").removeClass()
          $("body").addClass(res)
        timerCounter++
        if compLayerType.indexOf("page-comp") >= 0
          getPageAnnotations()

  #
  # Bindings
  #
  $('#reload-button').click ->
    clearInterval smartTimer if smartTimer?
    window.location.reload true
  $('#smart-toggle').click ->
    if smartTimer?
      $("#smart-toggle").removeClass("running")
      $('#one-page-annotations').removeClass("disabled")
      clearInterval smartTimer
      smartTimer = null
    else
      $("#smart-toggle").addClass("running")
      $('#one-page-annotations').addClass("disabled")
      smartTimer = setInterval checkForUpdates, 1000

  $('#one-page-annotations').click getPageAnnotations
  $('#convert-shape').click ->
    hook "convertShapeToHighlight()"
  $('#classic-highlight').click ->
    hook "$.evalFile($.includePath + '/../lib/nf_tools/nf-scripts/build/nf_SetupHighlightLayer.jsx')"
  $('#toggle-guides').click ->
    hook "toggleGuideLayers()"
  #
  # $('body').click ->
  #   checkForUpdates() unless smartTimer?

  $("#out-transition .nf-fade").click ->
    hook "transitionFadeOut()"
  $("#in-transition .nf-fade").click ->
    hook "transitionFadeIn()"
  $("#out-transition .nf-slide").click ->
    hook "transitionSlideOut()"
  $("#in-transition .nf-slide").click ->
    hook "transitionSlideIn()"
  $("#out-transition .nf-fade-scale").click ->
    hook "transitionFadeScaleOut()"
  $("#in-transition .nf-fade-scale").click ->
    hook "transitionFadeScaleIn()"
  $("#out-transition .clear").click ->
    hook "transitionClearOut()"
  $("#in-transition .clear").click ->
    hook "transitionClearIn()"


  extensionDirectory = csInterface.getSystemPath('extension')
