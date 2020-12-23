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
    return [arr[0] * 255, arr[1] * 255, arr[2] * 255];
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
      var data;
      console.log("polling data returned (" + (smartTimer != null ? timerCounter : "one-time") + ") - " + (new Date() - startInterval) + "ms");
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
  loadEmphasisPane = function() {
    var dataColor, effects, rgbString, rgba225Color;
    effects = $('body').data("effects");
    if (effects.length === 0) {
      return;
    }
    dataColor = effects[0].properties.Color.value;
    rgba225Color = rgbToRGBA255(dataColor);
    console.log("color from data is " + dataColor);
    rgbString = "rgb(" + (Math.round(rgba225Color[0])) + ", " + (Math.round(rgba225Color[1])) + ", " + (Math.round(rgba225Color[2])) + ")";
    console.log("setting css to " + rgbString);
    if (!pickerActive) {
      return empColorPickButton.css({
        'background-color': rgbString
      });
    }
  };
  empColorPickButton = $('#emphasizer-panel .color-field');
  colorPicker = new Picker(empColorPickButton[0]);
  pickerActive = false;
  colorPicker.setOptions({
    popup: "right",
    alpha: false,
    color: empColorPickButton.css("background-color"),
    onOpen: function(color) {
      pickerActive = true;
      return colorPicker.setColor(empColorPickButton.css('background-color'));
    },
    onChange: function(color) {
      console.log("change");
      return empColorPickButton.css({
        'background-color': color.rgbaString
      });
    },
    onDone: function(color) {
      var cylonParams;
      console.log("done");
      empColorPickButton.css({
        'background-color': color.rgbaString
      });
      cylonParams = {
        name: "AV Cylon1",
        color: rgbaToFloatRGB(color.rgba)
      };
      return hook("setCylonProperties('" + (JSON.stringify(cylonParams)) + "')");
    },
    onClose: function(color) {
      pickerActive = false;
      console.log("close");
      return loadEmphasisPane();
    }
  });
  return extensionDirectory = csInterface.getSystemPath('extension');
});
