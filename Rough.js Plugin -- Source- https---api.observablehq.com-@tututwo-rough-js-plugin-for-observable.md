# Rough.js Plugin  
// Source: https://api.observablehq.com/@tututwo/rough-js-plugin-for-observable-plot.js?v=4
// rough.js plugin for Observable Plot - v1.0.0 by Gordon Tu

// How to use it?
// Step 1. Copy `import {Plot} from "@tututwo/rough-js-plugin-for-observable-plot"` to your code
// Step 2. Include the rough options to your marks like below. Make sure to give your rough option an id property that is unique
// Step 3. Appreciate your hand-sketched plot!!!

// Example usage:
// Plot.barX(alphabet, {
//     x: "frequency",
//     y: "letter",
//     fill: "red",
//     stroke: "frequency",
//     sort: { y: "x", reverse: true },
//     rough: {
//         id: "I-am-an-id",
//         roughness: 1,
//         bowing: 1,
//         fillStyle: "solid"
//     }
// })

// For hand-sketched text:
// @import url('https://fonts.googleapis.com/css2?family=Gaegu:wght@300;400;700&display=swap');
// text {
//   font-family: "Gaegu", sans-serif;
//   font-size:1.1rem;
//   font-style: normal;
// }

// === CORE FUNCTIONS ===

function \_arealineY(Plot) {
  return function arealineY(
	data,
	{
	  color,
	  fillOpacity = 0.1,
	  rough = {
	    id: "firstDot",
	    roughness: 1,
	    bowing: 1,
	    fillStyle: "cross-hatch"
	  },
	  ...options
	} = {}
  ) {
	return Plot.marks(
	  Plot.ruleY([0]),
	  Plot.areaY(data, { fill: color, fillOpacity, ...options, rough }),
	  Plot.lineY(data, {
	    stroke: color,
	    ...options,
	    rough: {
	      id: "lineY-3",
	      roughness: 1,
	      bowing: 1,
	      fillStyle: "cross-hatch"
	    }
	  })
	);
  };
}

function \_isIterable() {
  return function isIterable(value) {
	return value && typeof value[Symbol.iterator] === "function";
  };
}

function \_roughPlugin(isIterable, plotFunctions, applyRoughStyling) {
  return function roughPlugin(Plot) {
	function wrapPlotFunction(funcName) {
	  const originalFunc = Plot[funcName];
	  const specialMarks = new Set(["frame", "sphere", "graticule"]);
	
	  Plot[funcName] = (...args) => {
	    let data, options;
	
	    if (specialMarks.has(funcName)) {
	      // Marks that only take options
	      options = args[0] || {};
	      console.log("Special mark detected:", funcName, options);
	    } else if (args.length === 1 && !isIterable(args[0])) {
	      [options] = args;
	      data = null;
	    } else {
	      [data, options = {}] = args;
	    }
	
	    const { rough, ...restOptions } = options || {};
	
	    // Call the original function appropriately
	    const mark = specialMarks.has(funcName)
	      ? originalFunc(restOptions)
	      : originalFunc(data, restOptions);
	
	    if (mark && typeof mark === "object") {
	      if (rough) {
	        const { id, ...roughOptions } = rough;
	        mark.rough = roughOptions;
	        mark.ariaLabel =
	          id ||
	          `rough-${funcName}-${Math.random().toString(36).substr(2, 9)}`;
	      }
	    }
	    return mark;
	  };
	}
	
	plotFunctions.forEach(wrapPlotFunction);
	
	const originalPlot = Plot.plot;
	Plot.plot = (options) => {
	  const svg = originalPlot(options);
	
	  function applyRoughToMark(mark) {
	    if (mark && mark.rough) {
	      const groupElements = svg.querySelectorAll(
	        `g[aria-label="${mark.ariaLabel}"], [aria-label="${mark.ariaLabel}"]`
	      );
	      console.log("Found elements:", groupElements);
	      if (groupElements.length > 0) {
	        applyRoughStyling(groupElements, mark.rough);
	      }
	    }
	  }
	
	  function processMarks(marks) {
	    marks.forEach((mark) => {
	      if (Array.isArray(mark)) {
	        // This is a custom mark (composite mark)
	        processMarks(mark);
	      } else if (typeof mark === "object" && mark !== null) {
	        // This is a normal mark
	        applyRoughToMark(mark);
	      }
	    });
	  }
	
	  // recursive processMarks function
	  processMarks(options.marks);
	  applyRoughToMark;
	
	  return svg;
	};
	return Plot;
  };
}

function \_applyRoughStyling(roughJS) {
  return function applyRoughStyling(gContainer, roughOptions) {
	const roughSvg = roughJS.svg(gContainer);
	
	gContainer.forEach((svg) => {
	  svg
	    .querySelectorAll(
	      "rect:not(clipPath *), circle:not(clipPath *), path:not(clipPath *), line:not(clipPath *)"
	    )
	    .forEach((element) => {
	      let roughElement;
	
	      // Extract fill and stroke from the original element
	      const fill =
	        svg.getAttribute("fill") ||
	        element.getAttribute("fill") ||
	        "transparent";
	      const stroke =
	        svg.getAttribute("stroke") ||
	        element.getAttribute("stroke") ||
	        "black";
	      const clipPath = element.getAttribute("clip-path") || "";
	
	      // Merge fill and stroke with roughOptions
	      const mergedOptions = {
	        ...roughOptions,
	        fill: roughOptions.fill || fill,
	        stroke: roughOptions.stroke || stroke
	      };
	
	      switch (element.tagName.toLowerCase()) {
	        case "rect":
	          const x = parseFloat(element.getAttribute("x") || 0);
	          const y = parseFloat(element.getAttribute("y") || 0);
	          const width = parseFloat(element.getAttribute("width"));
	          const height = parseFloat(element.getAttribute("height"));
	          roughElement = roughSvg.rectangle(
	            x,
	            y,
	            width,
	            height,
	            mergedOptions
	          );
	          break;
	        case "circle":
	          const cx = parseFloat(element.getAttribute("cx"));
	          const cy = parseFloat(element.getAttribute("cy"));
	          const r = parseFloat(element.getAttribute("r"));
	          roughElement = roughSvg.circle(cx, cy, r * 2, mergedOptions);
	          break;
	        case "path":
	          roughElement = roughSvg.path(element.getAttribute("d"), {
	            ...mergedOptions
	          });
	          break;
	        case "line":
	          const x1 = parseFloat(element.getAttribute("x1"));
	          const y1 = parseFloat(element.getAttribute("y1"));
	          const x2 = parseFloat(element.getAttribute("x2"));
	          const y2 = parseFloat(element.getAttribute("y2"));
	          roughElement = roughSvg.line(x1, y1, x2, y2, mergedOptions);
	          break;
	      }
	
	      if (roughElement) {
	        if (clipPath) {
	          // group.setAttribute("clip-path", clipPath);
	        }
	
	        roughElement.setAttribute(
	          "transform",
	          element.getAttribute("transform") ?? ""
	        );
	        roughElement.setAttribute("class", "rough-elements-group");
	
	        // Replace the original element with the rough element
	        element.parentNode.insertBefore(roughElement, element);
	        element.parentNode.removeChild(element);
	      }
	    });
	});
  };
}

// === LIBRARY SETUP ===

async function \_Plot(roughPlugin, require) {
  return roughPlugin(await require("@observablehq/plot"));
}

function \_a() {
  return import(
	"https://unpkg.com/roughjs@4.6.6/bundled/rough.esm.js?module"
  );
}

function \_roughJS(a) {
  return a.default;
}

// === DATA ===

function \_symbolsArr() {
  return [
	"circle",
	"cross",
	"diamond",
	"square",
	"star",
	"triangle",
	"wye",
	"plus",
	"times",
	"triangle2",
	"asterisk",
	"square2",
	"diamond2",
	"hexagon"
  ];
}

function \_plot\_all(Plot) {
  let classes = [];
  let functions = [];
  for (let i = 0; i \< Object.entries(Plot).length; i++) {
	if (Object.entries(Plot)[i][1].toString().startsWith("class")) {
	  classes.push(Object.entries(Plot)[i][0]);
	} else {
	  functions.push(Object.entries(Plot)[i][0]);
	}
  }
  return { classes, functions };
}

function \_plotFunctions() {
  return [
	"area",
	"areaX",
	"areaY",
	"arrow",
	"barX",
	"barY",
	"bollinger",
	"bollingerX",
	"bollingerY",
	"boxX",
	"boxY",
	"cell",
	"cellX",
	"cellY",
	"circle",
	"column",
	"contour",
	"crosshair",
	"crosshairX",
	"crosshairY",
	"delaunayLink",
	"delaunayMesh",
	"density",
	"differenceY",
	"dot",
	"dotX",
	"dotY",
	"frame",
	"geo",
	"graticule",
	"gridFx",
	"gridFy",
	"gridX",
	"gridY",
	"hexagon",
	"hexgrid",
	"hull",
	"legend",
	"line",
	"lineX",
	"lineY",
	"linearRegressionX",
	"linearRegressionY",
	"link",
	"raster",
	"rect",
	"rectX",
	"rectY",
	"ruleX",
	"ruleY",
	"sphere",
	"spike",
	"text",
	"textX",
	"textY"
  ];
}

// === OBSERVABLE MODULE DEFINITION ===

export default function define(runtime, observer) {
  const main = runtime.module();
  main.variable(observer("arealineY")).define("arealineY", ["Plot"], \_arealineY);
  main.variable(observer("isIterable")).define("isIterable", \_isIterable);
  main.variable(observer("roughPlugin")).define("roughPlugin", ["isIterable", "plotFunctions", "applyRoughStyling"], \_roughPlugin);
  main.variable(observer("applyRoughStyling")).define("applyRoughStyling", ["roughJS"], \_applyRoughStyling);
  main.variable(observer("Plot")).define("Plot", ["roughPlugin", "require"], \_Plot);
  main.variable(observer("a")).define("a", \_a);
  main.variable(observer("roughJS")).define("roughJS", ["a"], \_roughJS);
  main.variable(observer("symbolsArr")).define("symbolsArr", \_symbolsArr);
  main.variable(observer("plot\_all")).define("plot\_all", ["Plot"], \_plot\_all);
  main.variable(observer("plotFunctions")).define("plotFunctions", \_plotFunctions);
  return main;