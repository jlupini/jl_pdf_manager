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
  rgbaToFloatRGB = (arr) ->
    return [arr[0]/255, arr[1]/255, arr[2]/255]
  rgbToRGBA255 = (arr) ->
    return [arr[0]*255, arr[1]*255, arr[2]*255]


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
  timerCounter = 0
  checkForUpdates = ->
    if timerCounter >= 600
      console.log "threshold reached - stopping smart updates"
      timerCounter = 0
      $('#smart-toggle').click()
    else
      getPollingData()

  getPollingData = ->
    console.log "polling (#{if smartTimer? then timerCounter else "one-time"})..."
    startInterval = new Date()
    hook "getPollingData()", (res) ->
      console.log "polling data returned (#{if smartTimer? then timerCounter else "one-time"}) - #{new Date() - startInterval}ms"
      # console.log res
      data = JSON.parse res
      if compLayerType isnt data.bodyClass
        compLayerType = data.bodyClass
        $("body").removeClass()
        $("body").addClass(compLayerType)
      $("body").data data
      timerCounter++
      if compLayerType.indexOf("page-comp") >= 0
        getPageAnnotations()
      if compLayerType.indexOf("emphasis-layer") >= 0
        loadEmphasisPane()

  #
  # Bindings
  #
  $('#reload-button').click ->
    clearInterval smartTimer if smartTimer?
    hook "$.evalFile($.includePath + '/hooks.jsx')"
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
      smartTimer = setInterval checkForUpdates, 500

  # $('#smart-toggle').click()

  $('#single-fetch').click ->
    getPollingData()
  $('#convert-shape').click ->
    hook "convertShapeToHighlight()"
  $('#classic-highlight').click ->
    hook "$.evalFile($.includePath + '/../lib/nf_tools/nf-scripts/build/nf_SetupHighlightLayer.jsx')"
  $('#toggle-guides').click ->
    hook "toggleGuideLayers()"


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

  $("button.emphasizer-button").click ->
    hook "emphasisLayerSelected()", (res) ->
      if res is "true"
        alert "already emphasisezd"
      else hook "makeEmphasisLayer()"

  $("button.blend-button").click ->
    $('#blend-menu').toggle()
  $('#blend-screen-button').click ->
    $('#blend-menu').toggle()
    hook "setBlendingMode('screen')"
  $('#blend-normal-button').click ->
    $('#blend-menu').toggle()
    hook "setBlendingMode('normal')"
  $('#blend-multiply-button').click ->
    $('#blend-menu').toggle()
    hook "setBlendingMode('multiply')"
  $('#blend-overlay-button').click ->
    $('#blend-menu').toggle()
    hook "setBlendingMode('overlay')"


  loadEmphasisPane = ->
    effects = $('body').data("effects")
    return unless effects.length isnt 0

    # Color
    dataColor = effects[0].properties.Color.value
    rgba225Color = rgbToRGBA255(dataColor)
    console.log "color from data is #{dataColor}"
    # console.log "setting picker to  #{rgbToRGBA255(dataColor)}"
    rgbString = "rgb(#{Math.round rgba225Color[0]}, #{Math.round rgba225Color[1]}, #{Math.round rgba225Color[2]})"
    console.log "setting css to #{rgbString}"
    # colorPicker.setColor rgba225Color, true
    unless pickerActive
      empColorPickButton.css
        'background-color': rgbString


  empColorPickButton = $('#emphasizer-panel .color-field')
  colorPicker = new Picker empColorPickButton[0]
  pickerActive = false
  # console.log "color" + parent.style.backgroundColor
  colorPicker.setOptions
    popup: "right"
    alpha: false
    color: empColorPickButton.css "background-color"
    onOpen: (color) ->
      pickerActive = yes
      # Trust the button
      colorPicker.setColor empColorPickButton.css('background-color')
    onChange: (color) ->
      console.log "change"
      # Set the picker button's color
      empColorPickButton.css
        'background-color': color.rgbaString
    onDone: (color) ->
      console.log "done"
      # Set the picker button's color
      empColorPickButton.css
        'background-color': color.rgbaString
      # Set the actual cylon color
      ## FIXME: This only works for the first cylon right now
      cylonParams =
        name: "AV Cylon1"
        color: rgbaToFloatRGB(color.rgba)
      hook "setCylonProperties('#{JSON.stringify cylonParams}')"
    onClose: (color) ->
      pickerActive = no
      console.log "close"
      loadEmphasisPane()




  extensionDirectory = csInterface.getSystemPath('extension')
