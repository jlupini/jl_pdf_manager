$(document).ready(function() {
  var checkForUpdates, compLayerType, csInterface, extensionDirectory, getPageAnnotations, hook, latestAnnotationData, rgbToHex, smartTimer, timerCounter;
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
  checkForUpdates = function() {
    var startInterval;
    if (timerCounter >= 60) {
      console.log("threshold reached - stopping smart updates");
      timerCounter = 0;
      return $('#smart-toggle').click();
    } else {
      startInterval = new Date();
      console.log("polling (" + timerCounter + ")...");
      return hook("getCompAndLayerType()", function(res) {
        console.log("hook returned (" + timerCounter + ") - " + (new Date() - startInterval) + "ms");
        if (compLayerType !== res) {
          compLayerType = res;
          $("body").removeClass();
          $("body").addClass(res);
        }
        timerCounter++;
        if (compLayerType.indexOf("page-comp") >= 0) {
          return getPageAnnotations();
        }
      });
    }
  };
  $('#reload-button').click(function() {
    if (smartTimer != null) {
      clearInterval(smartTimer);
    }
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
      return smartTimer = setInterval(checkForUpdates, 1000);
    }
  });
  $('#one-page-annotations').click(getPageAnnotations);
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
  return extensionDirectory = csInterface.getSystemPath('extension');
});
