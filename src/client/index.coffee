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
  POLLING_TIMEOUT = 350
  NFClass =
    Comp: "NFComp"
    PartComp: "NFPartComp"
    PageComp: "NFPageComp"
    Layer: "NFLayer"
    PageLayer: "NFPageLayer"
    CitationLayer: "NFCitationLayer"
    GaussyLayer: "NFGaussyLayer"
    EmphasisLayer: "NFEmphasisLayer"
    HighlightLayer: "NFHighlightLayer"
    HighlightControlLayer: "NFHighlightControlLayer"
    ShapeLayer: "NFShapeLayer"

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
    return [Math.round(arr[0]*255), Math.round(arr[1]*255), Math.round(arr[2]*255)]

  displayError = (message) ->
    $bar = $('#error-bar')
    $bar.text "ERROR: #{message}"
    $bar.show()

  $('#error-bar').click ->
    $(this).hide()

  getPageAnnotations = ->
    disp = $("#annotation-display")
    annotationDate = new Date()
    console.log "getPageAnnotations()"
    hook "app.project", (res) ->
      if res?
        hook "getActivePageFile()", (result) ->
          console.log "annotation hook returned - #{new Date() - annotationDate}ms"
          console.log result
          if result isnt "null" and result isnt "" and result isnt null
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
      requestTime = new Date() - startInterval
      console.log "polling data returned (#{if smartTimer? then timerCounter else "one-time"}) - #{requestTime}ms"

      if not res?
        return console.log "empty result!"

      if requestTime > POLLING_TIMEOUT and smartTimer?
        timerCounter = 0
        $('#smart-toggle').click()
        return console.log "turning off smart updates - request took too long"

      if res.length is 0
        displayError "got nothing back from polling hook!"
        $("body").removeClass()
      else
        # console.log res
        data = JSON.parse res
        if compLayerType isnt data.bodyClass
          compLayerType = data.bodyClass
          $("body").removeClass()
          $("body").addClass(compLayerType)
        $("body").data data
        timerCounter++
        if compLayerType.indexOf(NFClass.PageComp) >= 0
          getPageAnnotations()
        if compLayerType.indexOf(NFClass.EmphasisLayer) >= 0
          loadEmphasisPane()
        if compLayerType.indexOf(NFClass.PartComp) >= 0
          loadLayoutPane()

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

  # Default the timer to on
  $('#smart-toggle').click()

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


  # # print all events on an element
  # getAllEvents = (element) ->
  #   result = []
  #   for key of element
  #     if key.indexOf('on') == 0
  #       result.push key.slice(2)
  #   result.join ' '
  #
  # el = $newShapeItem
  # el.bind getAllEvents(el[0]), (e) ->
  #   console.log e

  isChangingValue = no
  $('#emphasizer-panel .slider-container input').on "pointerdown", ->
    isChangingValue = yes

  $('#emphasizer-panel .slider-container input').change ->
    isChangingValue = no
    $(this).siblings(".value").text($(this).val())

    if $(this).is("#thickness-slider")
      thicknessValue = $(this).val()
      emphParams =
        name: $('#emphasis-list li.active').data().name
        thickness: thicknessValue
      hook "setEmphasisProperties('#{JSON.stringify emphParams}')"


  $('#emphasis-list').on 'click', 'li', ->
    $('#emphasis-list li.active').removeClass('active')
    $(this).addClass('active')
    loadEmphasisPane()

  $('#emphasizer-panel button.apply-to-all').click ->
    effects = $('body').data().effects
    for item in effects
      emphParams =
        name: item.name
        color: $('#emphasis-list li.active').data().properties.Color.value
      hook "setEmphasisProperties('#{JSON.stringify emphParams}')"

    loadEmphasisPane()

  loadEmphasisPane = ->
    data = $('body').data()
    sameLayer = no

    # Title
    $title = $("#emphasis-title")
    oldTitle = $title.text()
    if oldTitle is data.selectedLayers[0]
      sameLayer = yes
    else
      $title.text data.selectedLayers[0]

    # List
    $list = $('#emphasis-list')
    if sameLayer
      $activeItem = $list.find('li.active')
      if $activeItem? and $activeItem.data()?
        activeItemName = $activeItem.data().name
      else
        activeItemName = null
    $list.empty()
    if data.effects.length isnt 0
      # list.append "<li class='all'>All</li>"
      for effect, i in data.effects
        newItem = $("<li>#{effect.name}</li>").appendTo $list
        newItem.data effect

        if (i is 0 and not activeItemName?) or (effect.name is activeItemName)
          newItem.addClass("active")
        bullet = $("<span class='bullet'>&#9632;</span>").prependTo newItem
        bulletColor = rgbToHex rgbToRGBA255(effect.properties.Color.value.slice(0,3))
        bullet.css "color", bulletColor

    else
      $list.append "<li class='none'>No Emphasizers</li>"

    if data.effects.length isnt 0
      # Color
      dataColor = $list.find('li.active').data().properties.Color.value
      rgba225Color = rgbToRGBA255(dataColor)
      rgbString = "rgb(#{rgba225Color[0]}, #{rgba225Color[1]}, #{rgba225Color[2]})"
      unless pickerActive
        empColorPickButton.css
          'background-color': rgbString

      # Thickness
      unless isChangingValue
        dataThickness = $list.find('li.active').data().properties.Thickness.value
        $thicknessSlider = $('#thickness-slider')
        $thicknessSlider.val dataThickness
        $thicknessSlider.siblings(".value").text dataThickness


  empColorPickButton = $('#emphasizer-panel .color-field')
  colorPicker = new Picker empColorPickButton[0]
  pickerActive = false
  # console.log "color" + parent.style.backgroundColor
  colorPicker.setOptions
    popup: "top"
    alpha: false
    color: empColorPickButton.css "background-color"
    onOpen: (color) ->
      pickerActive = yes
      # Trust the button
      colorPicker.setColor empColorPickButton.css('background-color')
    onChange: (color) ->
      # Set the picker button's color
      empColorPickButton.css
        'background-color': color.rgbaString
    onDone: (color) ->
      # Set the picker button's color
      empColorPickButton.css
        'background-color': color.rgbaString
      # Set the actual cylon color
      emphParams =
        name: $('#emphasis-list li.active').data().name
        color: rgbaToFloatRGB(color.rgba)
      hook "setEmphasisProperties('#{JSON.stringify emphParams}')"
    onClose: (color) ->
      # Any data changes should have been made by now, so let's do the thing
      pickerActive = no
      loadEmphasisPane()

  loadLayoutPane = ->
    data = $("body").data()

    $itemName = $('#layout-panel .active-item .item-name')
    if data.selectedLayers.length is 0
      $itemName.text "No layer selected"
    else if data.selectedLayers.length is 1
      singleLayer = data.selectedLayers[0]
      $itemName.text singleLayer.name
    else if data.selectedLayers.length > 1
      $itemName.text "Multiple layers selected"

    if singleLayer?.class is NFClass.PageLayer
      $('#layout-panel .active-item button.shrink-page').removeClass 'disabled'
    else
      $('#layout-panel .active-item button.shrink-page').addClass 'disabled'

    # Load Selector
    # FIXME: need a way to refresh this.
    $list = $("#selector-list")
    if $list.children().length is 0
      hook "getFullPDFTree()", (res) ->
        selectorData = JSON.parse res
        console.log selectorData
        for pdfItem in selectorData.pdfs
          $newPDFItem = $("<li><span>#{pdfItem.name}</span></li>").appendTo $list
          $newPDFItem.data pdfItem
          $pageList = $("<ul></ul>").appendTo $newPDFItem
          for pageItem in pdfItem.pages
            $newPageItem = $("<li><span>#{pageItem.name}</span></li>").appendTo $pageList
            $newPageItem.data pageItem
            if pageItem.shapes.length > 0
              $shapeList = $("<ul></ul>").appendTo $newPageItem
              for shapeItem in pageItem.shapes

                $newShapeItem = $("<li><span>#{shapeItem.name}</span></li>").appendTo $shapeList
                $newShapeItem.data shapeItem

  $('#selector-list').on 'click', 'li', (event) ->
    event.stopPropagation()
    $('#selector-list li').removeClass('active')
    if $(this).data().class is NFClass.PageComp
      $('#layout-panel .fullscreen-title').removeClass('disabled')
    else
      $('#layout-panel .fullscreen-title').addClass('disabled')
    $(this).addClass 'active'

  $('#layout-panel .shrink-page').click (e) ->
    unless $(this).hasClass 'disabled'
      model =
        target: $('body').data().selectedLayers[0]
        command: "shrink-page"
      hook "runLayoutCommand(#{JSON.stringify model})"

  $('#layout-panel .fullscreen-title').click (e) ->
    unless $(this).hasClass 'disabled'
      $activeItem = $('#selector-list li.active')
      if $activeItem?.data().class is NFClass.PageComp
        model =
          target: $activeItem.data()
          command: "fullscreen-title"
        hook "runLayoutCommand(#{JSON.stringify model})"

  extensionDirectory = csInterface.getSystemPath('extension')
