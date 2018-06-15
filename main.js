//the RegExp is from https://www.jasondavies.com/wordcloud/cloud.min.js
var commonWords = /^(i|me|my|myself|we|us|our|ours|ourselves|you|your|yours|yourself|yourselves|he|him|his|himself|she|her|hers|herself|it|its|itself|they|them|their|theirs|themselves|what|which|who|whom|whose|this|that|these|those|am|is|are|was|were|be|been|being|have|has|had|having|do|does|did|doing|will|would|should|can|could|ought|i'm|you're|he's|she's|it's|we're|they're|i've|you've|we've|they've|i'd|you'd|he'd|she'd|we'd|they'd|i'll|you'll|he'll|she'll|we'll|they'll|isn't|aren't|wasn't|weren't|hasn't|haven't|hadn't|doesn't|don't|didn't|won't|wouldn't|shan't|shouldn't|can't|cannot|couldn't|mustn't|let's|that's|who's|what's|here's|there's|when's|where's|why's|how's|a|an|the|and|but|if|or|because|as|until|while|of|at|by|for|with|about|against|between|into|through|during|before|after|above|below|to|from|up|upon|down|in|out|on|off|over|under|again|further|then|once|here|there|when|where|why|how|all|any|both|each|few|more|most|other|some|such|no|nor|not|only|own|same|so|than|too|very|say|says|said|shall)$/;

var max,
    spiral, //
    scale,
    font,
    g,
    ctx,
    tmpCtx,
    width = 960,
    height = 600,
    halfW = width / 2,
    halfH = height / 2,
    calSize,
    calColor,
    calRotate,
    words,
    radian = Math.PI / 180;

var svg = d3.select("svg")
    .attr("width", width)
    .attr("height", height);

g = svg.append("g")
    .attr("transform", "translate(" + [halfW, halfH] + ")");

var canvas = d3.create("canvas")
    .attr("width", width)
    .attr("height", height);
ctx = canvas.node().getContext("2d");
ctx.translate(halfW, halfH);
ctx.textAlign = "center";

var tmpCanvas = d3.create("canvas")
    .attr("width", width)
    .attr("height", height);
tmpCtx = tmpCanvas.node().getContext("2d");
tmpCtx.translate(halfW, halfH);
tmpCtx.textAlign = "center";

d3.select("#go").on("click", function () {
    init();
    run();
});

init();
run();

function init() {
    var text = d3.select("#text").property("value"),
        angleCount = d3.select("#angle-count"),
        angleFrom = d3.select("#angle-from"),
        angleTo = d3.select("#angle-to"),
        angleCountVal = +angleCount.property("value"),
        angleFromVal = +angleFrom.property("value"),
        angleToVal = +angleTo.property("value");
    if (angleCountVal <= 0) {
        angleCountVal = 1;
        angleCount.property("value", angleCountVal);
    }
    if (angleFromVal < -90) {
        angleFromVal = -90;
        angleFrom.property("value", angleFromVal);
    }
    if (angleCountVal === 1) {
        angleToVal = angleFromVal;
        angleTo.property("value", angleToVal);
    }
    if (angleToVal > 90) {
        angleToVal = 90;
        angleTo.property("value", angleToVal);
    }
    max = +d3.select("#max").property("value");
    var spirals = prepareSpirals();
    spiral = spirals[d3.select("input[name='spiral']:checked").property("value")];
    scale = getScale(d3.select("input[name='scale']:checked").property("value"));
    font = d3.select("#font").property("value");
    // g.html("");
    ctx.clearRect(-halfW, -halfH, width, height);
    ctx.fillStyle = ctx.strokeStyle = "red";
    tmpCtx.fillStyle = tmpCtx.strokeStyle = "red";

    words = prepareWords(text);
    calSize = scale.domain([words[words.length - 1].count, words[0].count])
        .range([10, 100]);
    calColor = d3.scaleOrdinal(d3.schemeCategory10);
    calRotate = getCalRotate(angleCountVal, angleFromVal, angleToVal);
}

function run() {
    var wordsToShow = [],
        len = words.length,
        word;

    for (var i = 0; i < len; i++) {
        word = words[i];
        word.size = calSize(word.count);
        word.rotate = calRotate();
        word.fill = calColor(Math.floor(Math.random() * 10));

        if (place(word)) {
            wordsToShow.push(word);
            if (wordsToShow.length == max) break;
        }
    }

    display(wordsToShow);
}

function prepareWords(text) {
    //split text into words
    var rawWords = text.match(/\b(\w+)\b/g),
        wordCounts = {},
        len = rawWords.length,
        word,
        words = [];

    for (var i = 0; i < len; i++) {
        word = rawWords[i];
        word = word.toLowerCase();

        //leave out too common words like "the"
        if (commonWords.test(word)) continue;

        if (wordCounts[word] === undefined) {
            wordCounts[word] = 0;
        }
        wordCounts[word]++;
    }

    for (word in wordCounts) {
        var count = wordCounts[word];
        words.push({ text: word, "count": count });
    }
    words.sort(function (a, b) {
        return b.count - a.count;
    });

    return words;
}

function place(word) {
    var collision,
        thetaIncrement = Math.PI / 8 * (Math.random() < 0.5 ? -1 : 1),
        theta = 0,
        origin = {},
        r2,
        r2Max,
        d;

    //init word position
    word.x = (Math.random() * 2 - 1) * 64; // ??
    word.y = (Math.random() * 2 - 1) * 64;
    origin.x = word.x;
    origin.y = word.y;
    r2 = 0;
    r2Max = Math.max(
        calR2({ x: -halfW, y: -halfH }, origin),
        calR2({ x: halfW, y: -halfH }, origin),
        calR2({ x: -halfW, y: halfH }, origin),
        calR2({ x: halfW, y: halfH }, origin)
    );
    collision = detectCollision(word);

    while ((collision.overlap || collision.overflow) && r2 <= r2Max) {
        //calculate the position
        d = spiral(theta);
        word.x = d.x + origin.x;
        word.y = d.y + origin.y;

        //detect collision
        collision = detectCollision(word);
        r2 = calR2(word, origin);
        theta += thetaIncrement;
    }

    if (collision.overflow) {
        return false;
    }

    ctx.save();
    ctx.font = word.size + "px " + font;
    ctx.translate(word.x, word.y);
    ctx.rotate(word.rotate);
    ctx.fillText(word.text, 0, 0);
    ctx.restore();
    return true;
}

function calR2(p1, p2) {
    var dx = p1.x - p2.x;
    var dy = p1.y - p2.y;
    return dx * dx + dy * dy;
}

function detectCollision(word) {
    if (word.bounding == undefined) {
        calBoundingRect(word);
    }
    var dx = word.bounding.x,
        dy = word.bounding.y,
        w = word.bounding.w,
        h = word.bounding.h,
        x = word.x + dx + halfW,
        y = word.y + dy + halfH;

    if (x < 0 || x + w > width ||
        y < 0 || y + h > height) {
        return { overflow: true, overlap: undefined };
    }

    var pixels = ctx.getImageData(x, y, w, h).data; //this uses absolute coords = =...

    var len = pixels.length;
    for (var i = 0; i < len; i += 4) {
        if (word.sprite[i] && pixels[i]) {
            return { overflow: false, overlap: true };
        }
    }
    return { overflow: false, overlap: false };
}

function calBoundingRect(word) {
    ctx.save();
    ctx.font = word.size + "px " + font;
    var textW = ctx.measureText(word.text).width,
        textH = word.size,
        sin = Math.abs(Math.sin(word.rotate)),
        cos = Math.abs(Math.cos(word.rotate)),
        boundingW = textW * cos + textH * sin,
        boundingH = textW * sin + textH * cos,
        boundingY = - boundingH + textW / 2 * sin,
        boundingX = (word.rotate > 0)
            ? - textW / 2 * cos
            : - boundingW + textW / 2 * cos;
    ctx.restore();

    word.bounding = {
        x: boundingX,
        y: boundingY,
        w: boundingW,
        h: boundingH,
    }

    tmpCtx.save();
    tmpCtx.clearRect(-halfW, -halfH, width, height);
    tmpCtx.font = word.size + "px " + font;
    tmpCtx.rotate(word.rotate);
    tmpCtx.fillText(word.text, 0, 0); //middle of the canvas
    word.sprite = tmpCtx.getImageData(boundingX + halfW,
        boundingY + halfH, boundingW, boundingH).data;
    tmpCtx.restore();
}

function display(wordsToShow) {
    var update = g.selectAll("text")
        .data(wordsToShow);
    update.enter().append("text")
        .attr("text-anchor", "middle");
    g.selectAll("text")
        .transition()
        .duration(1000)
        .attr("transform", (d) => 'translate(' + [d.x, d.y] +
            ') rotate(' + (d.rotate / radian) + ')')
        .style("font-size", (d) => d.size + "px")
        .style("font-family", font)
        .style("fill", (d) => d.fill)
        .text((d) => d.text);
    update.exit().remove();
}

function prepareSpirals() {
    var ratio = width / height;

    return {
        archimedean: function (theta) {
            var r = theta * 5;
            return { x: r * Math.cos(theta) * ratio, y: r * Math.sin(theta) };
        },
        rectangular: (function () { // so awkward...
            var dy = 25,
                dx = dy * ratio,
                x = 0,
                y = 0,
                i = 0,
                len = 1,
                dir = 0;
            return function (theta) {
                if (theta == 0) {
                    x = 0,
                        y = 0,
                        i = 0,
                        len = 1,
                        dir = 0;
                }
                if (i >= len) {
                    i = 0;
                    if (dir % 2 == 0) {
                        len++;
                    }
                    dir++;
                    dir %= 4;
                }
                if (theta > 0) {
                    switch (dir) {
                        case 0: x += dx; break;
                        case 1: y -= dy; break;
                        case 2: x -= dx; break;
                        case 3: y += dy; break;
                    }
                }
                else {
                    switch (dir) {
                        case 0: y -= dy; break;
                        case 1: x += dx; break;
                        case 2: y += dy; break;
                        case 3: x -= dx; break;
                    }
                }
                // console.log(dir);
                i++;
                return { "x": x, "y": y };
            }
        })()
    };
}

function getScale(name) {
    switch (name) {
        case "linear": return d3.scaleLinear();
        case "sqrt": return d3.scaleSqrt();
        case "log": return d3.scaleLog();
        default: return d3.scaleLinear();
    }
}

function getCalRotate(angleCount, angleFrom, angleTo) {
    var angleSlice;

    if (angleCount === 1) {
        return function () {
            return angleFrom * radian;
        }
    }
    else {
        angleSlice = (angleTo - angleFrom) / (angleCount - 1);
        return function () {
            return (Math.floor(Math.random() * angleCount) * angleSlice + angleFrom) * radian;
        }
    }
}