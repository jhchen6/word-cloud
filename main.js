//the RegExp is from https://www.jasondavies.com/wordcloud/cloud.min.js
var commonWords = /^(i|me|my|myself|we|us|our|ours|ourselves|you|your|yours|yourself|yourselves|he|him|his|himself|she|her|hers|herself|it|its|itself|they|them|their|theirs|themselves|what|which|who|whom|whose|this|that|these|those|am|is|are|was|were|be|been|being|have|has|had|having|do|does|did|doing|will|would|should|can|could|ought|i'm|you're|he's|she's|it's|we're|they're|i've|you've|we've|they've|i'd|you'd|he'd|she'd|we'd|they'd|i'll|you'll|he'll|she'll|we'll|they'll|isn't|aren't|wasn't|weren't|hasn't|haven't|hadn't|doesn't|don't|didn't|won't|wouldn't|shan't|shouldn't|can't|cannot|couldn't|mustn't|let's|that's|who's|what's|here's|there's|when's|where's|why's|how's|a|an|the|and|but|if|or|because|as|until|while|of|at|by|for|with|about|against|between|into|through|during|before|after|above|below|to|from|up|upon|down|in|out|on|off|over|under|again|further|then|once|here|there|when|where|why|how|all|any|both|each|few|more|most|other|some|such|no|nor|not|only|own|same|so|than|too|very|say|says|said|shall)$/;

var max,
    spiral, //
    scale,
    font,
    g,
    svgNS = "http://www.w3.org/2000/svg",
    ctx,
    tmpCtx,
    canvasW,
    canvasH,
    halfCanvasW,
    halfCanvasH,
    calSize,
    calColor,
    calRotate;

$(document).ready(function () {
    g = document.createElementNS(svgNS, "g");
    $(g).attr("transform", 'translate(480, 300)');
    $("svg")[0].appendChild(g);

    var canvas = document.createElement("canvas");
    $(canvas)
        .attr("width", 960)
        .attr("height", 600);
    ctx = canvas.getContext("2d");
    ctx.translate(480, 300);
    ctx.textAlign = "center";
    canvasW = canvas.width;
    canvasH = canvas.height;
    halfCanvasW = canvasW / 2;
    halfCanvasH = canvasH / 2;

    var tmpCanvas = document.createElement("canvas");
    $(tmpCanvas)
        .attr("width", 960)
        .attr("height", 600);
    tmpCtx = tmpCanvas.getContext("2d");
    tmpCtx.translate(480, 300);
    tmpCtx.textAlign = "center";

    // $("body").prepend(tmpCanvas);
    // $("body").prepend(canvas);

    // $("#form").submit(function () {
    //     var words = init();
    //     start(words);
    //     return false;
    // });
    $("#go").click(function () {
        var words = init();
        start(words);
    });

    var words = init();
    start(words);
});

function init() {
    var text = $("#text").val(),
        angleCount = $("#angle-count"),
        angleFrom = $("#angle-from"),
        angleTo = $("#angle-to"),
        angleCountVal = +angleCount.val(),
        angleFromVal = +angleFrom.val(),
        angleToVal = +angleTo.val();
    if (angleCountVal <= 0) {
        angleCountVal = 1;
        angleCount.val(angleCountVal);
    }
    if (angleFromVal < -90) {
        angleFromVal = -90;
        angleFrom.val(angleFromVal);
    }
    if (angleCountVal === 1) {
        angleToVal = angleFromVal;
        angleTo.val(angleToVal);
    }
    if (angleToVal > 90) {
        angleToVal = 90;
        angleTo.val(angleToVal);
    }
    max = +$("#max").val();
    var spirals = prepareSpirals();
    spiral = spirals[$("input[name='spiral']:checked").val()];
    scale = scales[$("input[name='scale']:checked").val()];
    font = $("#font").val();
    g.innerHTML = "";
    ctx.clearRect(-halfCanvasW, -halfCanvasH, canvasW, canvasH);
    ctx.fillStyle = ctx.strokeStyle = "red";
    tmpCtx.fillStyle = tmpCtx.strokeStyle = "red";

    var words = prepareWords(text);
    calSize = prepareCalSize(words);
    calColor = prepareCalColor();
    calRotate = getCalRotate(angleCountVal, angleFromVal, angleToVal);

    return words;
}

function start(words) {
    var wordsToShow = [],
        len = words.length,
        word;

    for (var i = 0; i < len; i++) {
        word = words[i];
        word.size = calSize(word);
        word.rotate = calRotate();
        word.fill = calColor();

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

    for (var word in wordCounts) {
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
        calR2({ x: -halfCanvasW, y: -halfCanvasH }, origin),
        calR2({ x: halfCanvasW, y: -halfCanvasH }, origin),
        calR2({ x: -halfCanvasW, y: halfCanvasH }, origin),
        calR2({ x: halfCanvasW, y: halfCanvasH }, origin)
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

    // ctx.save();
    // ctx.translate(word.x, word.y);
    // ctx.strokeStyle = "black";
    // ctx.strokeRect(word.bounding.x, word.bounding.y, word.bounding.w, word.bounding.h);
    // ctx.restore();

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
        x = word.x + dx + halfCanvasW,
        y = word.y + dy + halfCanvasH;

    if (x < 0 || x + w > canvasW ||
        y < 0 || y + h > canvasH) {
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
    word.bounding = {
        x: boundingX,
        y: boundingY,
        w: boundingW,
        h: boundingH,
    }
    ctx.restore();

    tmpCtx.save();
    tmpCtx.clearRect(-halfCanvasW, -halfCanvasH, canvasW, canvasH);
    tmpCtx.font = word.size + "px " + font;
    tmpCtx.rotate(word.rotate);
    tmpCtx.fillText(word.text, 0, 0); //middle of the canvas
    word.sprite = tmpCtx.getImageData(boundingX + halfCanvasW,
        boundingY + halfCanvasH, boundingW, boundingH).data;
    tmpCtx.restore();
}

function display(wordsToShow) {
    var text,
        len = wordsToShow.length,
        word,
        radian = Math.PI / 180;
    for (var i = 0; i < len; i++) {
        word = wordsToShow[i];
        text = document.createElementNS(svgNS, "text");
        $(text)
            .attr("transform", 'translate(' + [word.x, word.y] +
                ') rotate(' + (word.rotate / radian) + ')')
            .attr("text-anchor", "middle")
            .css({
                "font-size": word.size + "px",
                "font-family": font,
                "fill": word.fill
            })
            .text(word.text);
        g.appendChild(text);

        // drawRect(word, word.bounding.x, word.bounding.y, word.bounding.w, word.bounding.h);
    }
    // drawCircle(0, 0, 5);
}

function prepareSpirals() {
    var ratio = canvasW / canvasH;

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

var scales = {
    "linear": function (n) {
        return n;
    },
    "sqrt": function (n) {
        return Math.sqrt(n);
    },
    "log": function (n) {
        return Math.log(n);
    }
};

function prepareCalSize(words) {
    var domain = {
        min: scale(words[words.length - 1].count),
        max: scale(words[0].count)
    },
        range = { min: 10, max: 100 },
        constant = 0;
    if (domain.min != domain.max) {
        constant = (range.min - range.max) / (domain.min - domain.max);
    }

    return function (word) {
        return constant * (scale(word.count) - domain.max) + range.max;
    }
}

function prepareCalColor() {
    return function () { //avoid rgb(255,255,255) white
        return "rgb(" + Math.random() * 255 + ", " +
            Math.random() * 255 + "," + Math.random() * 255 + ")";
    }
}

function getCalRotate(angleCount, angleFrom, angleTo) {
    var radian = Math.PI / 180,
        angleSlice;

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

function drawCircle(cx, cy, r) {
    var circle = document.createElementNS(svgNS, "circle");
    $(circle)
        .attr({ "cx": cx, "cy": cy, "r": r })
        .css("fill", "black");
    g.appendChild(circle);
}

function drawRect(word, x, y, w, h) {
    var rect = document.createElementNS(svgNS, "rect");
    $(rect).attr("transform", 'translate(' + [word.x, word.y] + ')')
        .attr("x", x)
        .attr("y", y)
        .attr("width", w)
        .attr("height", h)
        .css("fill", "none")
        .css("stroke", "black")
        .css("stroke-width", "1");
    g.appendChild(rect);
}