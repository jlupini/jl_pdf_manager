$(document).ready(function() {
  var checkForUpdates, colorPicker, compLayerType, csInterface, empColorPickButton, extensionDirectory, getPageAnnotations, getPollingData, hook, latestAnnotationData, loadEmphasisPane, pickerActive, rgbToHex, rgbToRGBA255, rgbaToFloatRGB, smartTimer, timerCounter;
  csInterface = new CSInterface;
  csInterface.requestOpenExtension('com.my.localserver', '');
  hook = function(hookString, callback) {
    if (callback == null) {
      callback = null;
    }
    return csInterface.evalScript(hookString, callback);
  };
  hook("$.evalFile($.includePath + '/../lib/nf_tools/nf-scripts/build/runtimeLibraries.jsx')");
  latestAnnotationData = {};
  smartTimer = null;
  timerCounter = 0;
  rgbToHex = function(r, g, b) {
    var componentToHex;
    componentToHex = function(c) {
      var hex;
      hex = c.toString(16);
      if (hex.length === 1) {
        return '0' + hex;
      } else {
        return hex;
      }
    };
    if (r.length === 3) {
      b = r[2];
      g = r[1];
      r = r[0];
    }
    return '#' + componentToHex(r) + componentToHex(g) + componentToHex(b);
  };
  rgbaToFloatRGB = function(arr) {
    return [arr[0] / 255, arr[1] / 255, arr[2] / 255];
  };
  rgbToRGBA255 = function(arr) {
    return [Math.round(arr[0] * 255), Math.round(arr[1] * 255), Math.round(arr[2] * 255)];
  };
  getPageAnnotations = function() {
    var annotationDate, disp;
    disp = $("#annotation-display");
    annotationDate = new Date();
    console.log("getPageAnnotations()");
    return hook("app.project", function(res) {
      if (res != null) {
        return hook("getActivePageFile()", function(result) {
          var url;
          console.log("annotation hook returned - " + (new Date() - annotationDate) + "ms");
          console.log(result);
          if (result !== "null") {
            url = 'http://localhost:3200/annotationData';
            return $.ajax({
              type: 'GET',
              url: url,
              data: {
                filepath: result
              },
              success: function(response) {
                var annotation, annotationDataString, colorClassName, dispElement, dispID, i, j, len, results;
                if (JSON.stringify(response) === JSON.stringify(latestAnnotationData)) {

                } else {
                  latestAnnotationData = response;
                  disp.empty();
                  if (response.length === 0) {
                    return disp.append("<p class='no-annotations-found'>No annotations found in this PDF</p>");
                  } else {
                    results = [];
                    for (i = j = 0, len = response.length; j < len; i = ++j) {
                      annotation = response[i];
                      dispID = "annotation-" + i;
                      colorClassName = annotation.colorName.replace(/\s+/g, '-').toLowerCase();
                      disp.append("<li id='" + dispID + "' class='annotation-item " + colorClassName + "'></li>");
                      dispElement = $("#" + dispID);
                      dispElement.append("<div class='clean-name'>" + annotation.cleanName + "</div> <div class='highlight-text'>" + annotation.text + "</div>");
                      annotationDataString = JSON.stringify(annotation);
                      results.push(dispElement.click({
                        param: annotationDataString
                      }, function(e) {
                        return hook("createHighlightFromAnnotation('" + e.data.param + "')");
                      }));
                    }
                    return results;
                  }
                }
              },
              error: function(jqXHR, textStatus, errorThrown) {
                console.log("Error: " + errorThrown + ", " + jqXHR.responseJSON);
                disp.empty();
                disp.append("<p class='error-thrown'>The PDF Server returned an error. 🤷Talk to Jesse...</p>");
                return latestAnnotationData = {};
              }
            });
          } else {
            disp.empty();
            disp.append("<p class='no-active-page'>No active page</p>");
            return latestAnnotationData = {};
          }
        });
      } else {
        disp.empty();
        disp.append("<p class='no-active-project'>No active project</p>");
        return latestAnnotationData = {};
      }
    });
  };
  compLayerType = "";
  timerCounter = 0;
  checkForUpdates = function() {
    if (timerCounter >= 600) {
      console.log("threshold reached - stopping smart updates");
      timerCounter = 0;
      return $('#smart-toggle').click();
    } else {
      return getPollingData();
    }
  };
  getPollingData = function() {
    var startInterval;
    console.log("polling (" + (smartTimer != null ? timerCounter : "one-time") + ")...");
    startInterval = new Date();
    return hook("getPollingData()", function(res) {
      var data, requestTime;
      requestTime = new Date() - startInterval;
      console.log("polling data returned (" + (smartTimer != null ? timerCounter : "one-time") + ") - " + requestTime + "ms");
      if (res == null) {
        return console.log("empty result!");
      }
      if (requestTime > 250 && (smartTimer != null)) {
        timerCounter = 0;
        $('#smart-toggle').click();
        return console.log("turning off smart updates - request took too long");
      }
      data = JSON.parse(res);
      if (compLayerType !== data.bodyClass) {
        compLayerType = data.bodyClass;
        $("body").removeClass();
        $("body").addClass(compLayerType);
      }
      $("body").data(data);
      timerCounter++;
      if (compLayerType.indexOf("page-comp") >= 0) {
        getPageAnnotations();
      }
      if (compLayerType.indexOf("emphasis-layer") >= 0) {
        return loadEmphasisPane();
      }
    });
  };
  $('#reload-button').click(function() {
    if (smartTimer != null) {
      clearInterval(smartTimer);
    }
    hook("$.evalFile($.includePath + '/hooks.jsx')");
    return window.location.reload(true);
  });
  $('#smart-toggle').click(function() {
    if (smartTimer != null) {
      $("#smart-toggle").removeClass("running");
      $('#one-page-annotations').removeClass("disabled");
      clearInterval(smartTimer);
      return smartTimer = null;
    } else {
      $("#smart-toggle").addClass("running");
      $('#one-page-annotations').addClass("disabled");
      return smartTimer = setInterval(checkForUpdates, 500);
    }
  });
  $('#smart-toggle').click();
  $('#single-fetch').click(function() {
    return getPollingData();
  });
  $('#convert-shape').click(function() {
    return hook("convertShapeToHighlight()");
  });
  $('#classic-highlight').click(function() {
    return hook("$.evalFile($.includePath + '/../lib/nf_tools/nf-scripts/build/nf_SetupHighlightLayer.jsx')");
  });
  $('#toggle-guides').click(function() {
    return hook("toggleGuideLayers()");
  });
  $("#out-transition .nf-fade").click(function() {
    return hook("transitionFadeOut()");
  });
  $("#in-transition .nf-fade").click(function() {
    return hook("transitionFadeIn()");
  });
  $("#out-transition .nf-slide").click(function() {
    return hook("transitionSlideOut()");
  });
  $("#in-transition .nf-slide").click(function() {
    return hook("transitionSlideIn()");
  });
  $("#out-transition .nf-fade-scale").click(function() {
    return hook("transitionFadeScaleOut()");
  });
  $("#in-transition .nf-fade-scale").click(function() {
    return hook("transitionFadeScaleIn()");
  });
  $("#out-transition .clear").click(function() {
    return hook("transitionClearOut()");
  });
  $("#in-transition .clear").click(function() {
    return hook("transitionClearIn()");
  });
  $("button.emphasizer-button").click(function() {
    return hook("emphasisLayerSelected()", function(res) {
      if (res === "true") {
        return alert("already emphasisezd");
      } else {
        return hook("makeEmphasisLayer()");
      }
    });
  });
  $("button.blend-button").click(function() {
    return $('#blend-menu').toggle();
  });
  $('#blend-screen-button').click(function() {
    $('#blend-menu').toggle();
    return hook("setBlendingMode('screen')");
  });
  $('#blend-normal-button').click(function() {
    $('#blend-menu').toggle();
    return hook("setBlendingMode('normal')");
  });
  $('#blend-multiply-button').click(function() {
    $('#blend-menu').toggle();
    return hook("setBlendingMode('multiply')");
  });
  $('#blend-overlay-button').click(function() {
    $('#blend-menu').toggle();
    return hook("setBlendingMode('overlay')");
  });
  $('#emphasizer-panel .slider-container input').change(function() {
    return $(this).siblings(".value").text($(this).val());
  });
  $('#emphasis-list').on('click', 'li', function() {
    $('#emphasis-list li.active').removeClass('active');
    $(this).addClass('active');
    return loadEmphasisPane();
  });
  $('#emphasizer-panel button.apply-to-all').click(function() {
    var effects, emphParams, item, j, len;
    effects = $('body').data().effects;
    for (j = 0, len = effects.length; j < len; j++) {
      item = effects[j];
      emphParams = {
        name: item.name,
        color: $('#emphasis-list li.active').data().properties.Color.value
      };
      hook("setEmphasisProperties('" + (JSON.stringify(emphParams)) + "')");
    }
    return loadEmphasisPane();
  });
  loadEmphasisPane = function() {
    var $activeItem, $list, $title, activeItemName, bullet, bulletColor, data, dataColor, effect, i, j, len, newItem, oldTitle, ref, rgbString, rgba225Color, sameLayer;
    data = $('body').data();
    sameLayer = false;
    $title = $("#emphasis-title");
    oldTitle = $title.text();
    if (oldTitle === data.selectedLayers[0]) {
      sameLayer = true;
    } else {
      $title.text(data.selectedLayers[0]);
    }
    $list = $('#emphasis-list');
    if (sameLayer) {
      $activeItem = $list.find('li.active');
      if (($activeItem != null) && ($activeItem.data() != null)) {
        activeItemName = $activeItem.data().name;
      } else {
        activeItemName = null;
      }
    }
    $list.empty();
    if (data.effects.length !== 0) {
      ref = data.effects;
      for (i = j = 0, len = ref.length; j < len; i = ++j) {
        effect = ref[i];
        newItem = $("<li>" + effect.name + "</li>").appendTo($list);
        newItem.data(effect);
        if ((i === 0 && (activeItemName == null)) || (effect.name === activeItemName)) {
          newItem.addClass("active");
        }
        bullet = $("<span class='bullet'>&#9632;</span>").prependTo(newItem);
        bulletColor = rgbToHex(rgbToRGBA255(effect.properties.Color.value.slice(0, 3)));
        bullet.css("color", bulletColor);
      }
    } else {
      $list.append("<li class='none'>No Emphasizers</li>");
    }
    if (data.effects.length !== 0) {
      dataColor = $list.find('li.active').data().properties.Color.value;
      rgba225Color = rgbToRGBA255(dataColor);
      rgbString = "rgb(" + rgba225Color[0] + ", " + rgba225Color[1] + ", " + rgba225Color[2] + ")";
      if (!pickerActive) {
        return empColorPickButton.css({
          'background-color': rgbString
        });
      }
    }
  };
  empColorPickButton = $('#emphasizer-panel .color-field');
  colorPicker = new Picker(empColorPickButton[0]);
  pickerActive = false;
  colorPicker.setOptions({
    popup: "top",
    alpha: false,
    color: empColorPickButton.css("background-color"),
    onOpen: function(color) {
      pickerActive = true;
      return colorPicker.setColor(empColorPickButton.css('background-color'));
    },
    onChange: function(color) {
      return empColorPickButton.css({
        'background-color': color.rgbaString
      });
    },
    onDone: function(color) {
      var emphParams;
      empColorPickButton.css({
        'background-color': color.rgbaString
      });
      emphParams = {
        name: $('#emphasis-list li.active').data().name,
        color: rgbaToFloatRGB(color.rgba)
      };
      return hook("setEmphasisProperties('" + (JSON.stringify(emphParams)) + "')");
    },
    onClose: function(color) {
      pickerActive = false;
      return loadEmphasisPane();
    }
  });
  return extensionDirectory = csInterface.getSystemPath('extension');
});
