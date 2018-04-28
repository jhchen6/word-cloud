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
    $(canvas).attr("width", 960)
        .attr("height", 600);
    ctx = canvas.getContext("2d");
    ctx.translate(480, 300);
    ctx.textAlign = "center";
    canvasW = canvas.width;
    canvasH = canvas.height;
    halfCanvasW = canvasW / 2;
    halfCanvasH = canvasH / 2;

    var tmpCanvas = document.createElement("canvas");
    $(tmpCanvas).attr("width", 960)
        .attr("height", 600);
    tmpCtx = tmpCanvas.getContext("2d");
    tmpCtx.translate(480, 300);
    tmpCtx.textAlign = "center";

    // $("body").prepend(tmpCanvas);
    // $("body").prepend(canvas);

    $("#form").submit(function () {
        var words = init();
        start(words);
    });

    var words = init();
    start(words);
});

function init() {
    var text = $("#text").val(),
        angleCount = +$("#angle-count").val(),
        angleFrom = +$("#angle-from").val(),
        angleTo = +$("#angle-to").val();
    if (angleFrom < -90) angleFrom = -90;
    if (angleTo > 90) angleTo = 90;

    max = +$("#max").val();
    spiral = spirals[$("input[name='spiral']").val()];
    scale = scales[$("input[name='scale']").val()];
    font = $("#font").val();
    g.innerHTML = "";
    ctx.clearRect(-halfCanvasH, -halfCanvasH, canvasW, canvasH);
    ctx.fillStyle = ctx.strokeStyle = "red";
    tmpCtx.fillStyle = tmpCtx.strokeStyle = "red";

    var words = prepareWords(text);
    calSize = prepareCalSize(words);
    calColor = prepareCalColor();
    calRotate = getCalRotate(angleCount, angleFrom, angleTo);

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
            wordCounts[word] = 1;
        }
        else {
            wordCounts[word]++;
        }
    }

    for (var word in wordCounts) {
        var count = wordCounts[word];
        words.push({ text: word, count: count, });
    }
    words.sort(function (a, b) {
        return b.count - a.count;
    });

    return words;
}

function place(word) {
    var collision,
        thetaIncrement = Math.PI / 8,
        theta = thetaIncrement,
        origin = {},
        r2,
        r2Max;

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
        word.x = spiral(theta) * Math.cos(theta) + origin.x;
        word.y = spiral(theta) * Math.sin(theta) + origin.y;

        //detect collision
        collision = detectCollision(word);
        r2 = calR2(word, origin);
        theta += thetaIncrement;
    }

    if (collision.overflow) {
        // word.placed = false;
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

    // word.placed = true;
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
        // word.overflow = true;
        // word.overlap = undefined;
        return { overflow: true, overlap: undefined };
    }

    ctx.save();
    ctx.translate(word.x, word.y);
    var pixels = ctx.getImageData(x, y, w, h).data; //this uses absolute coords = =...
    ctx.restore();

    // var countTmp = 0,
    //     count = 0;
    var len = pixels.length;
    for (var i = 0; i < len; i += 4) {
        if (word.sprite[i] && pixels[i]) {
            // word.overflow = false;
            // word.overlap = true;
            return { overflow: false, overlap: true };
        }
        //     if (tmpPixels[i]) {
        //         countTmp++;
        //     }
        //     if (pixels[i]) {
        //         count++;
        //     }
    }

    // console.log(pixels.length, count);
    // console.log(tmpPixels.length, countTmp);

    // word.overflow = false;
    // word.overlap = false;

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

        // var rect = document.createElementNS(svgNS, "rect");
        // $(rect)
        //     .attr({
        //         "transform": 'translate(' + [word.x, word.y] + ')',
        //         "x": word.bounding.x,
        //         "y": word.bounding.y,
        //         "width": word.bounding.w,
        //         "height": word.bounding.h
        //     })
        //     .css({
        //         "fill": "none",
        //         "stroke": "black",
        //         "stroke-width": "1"
        //     });
        // g.appendChild(rect);
    }

    // var circle = document.createElementNS(svgNS, "circle");
    // $(circle)
    //     .attr({
    //         "cx": 0,
    //         "cy": 0,
    //         "r": 5
    //     })
    //     .css({
    //         "fill": "black"
    //     });
    // g.appendChild(circle);
}

var spirals = {
    archimedean: function (theta) {
        return theta * 5;
    },
    rectangular: function (theta) { //TODO
        return theta * 5;
    }
};

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
        constant = (range.min - range.max) / (domain.min - domain.max);

    return function (word) {
        return constant * (scale(word.count) - domain.max) + range.max;
    }

    // calColor = function (word) { //grey scale...
    //     return "rgb(" + colorScale(word) + ", " +
    //         colorScale(word) + "," + colorScale(word) + ")";
    // }

    // calColor = function (word) { //avoid 255,255,255
    //     return "rgb(" + Math.random() * 255 + ", " +
    //         Math.random() * 255 + "," + Math.random() * 255 + ")";
    // }

    // function colorScale(word) {
    //     return colorConst * (scale(word.count) - domain.max) + colorRange.max;
    // }
}

function prepareCalColor() {
    return function () { //avoid 255,255,255
        return "rgb(" + Math.random() * 255 + ", " +
            Math.random() * 255 + "," + Math.random() * 255 + ")";
    }
}

function getCalRotate(angleCount, angleFrom, angleTo) {
    var angleSlice = (angleTo - angleFrom) / (angleCount - 1),
        radian = Math.PI / 180;
    return function () {
        return (Math.floor(Math.random() * angleCount) * angleSlice + angleFrom) * radian;
    }
}
