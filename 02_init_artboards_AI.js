#target illustrator

// 해당 스크립트는 작업사이즈, 재단사이즈에 맞춰 일러스트 문서를 수정합니다.
// 빨간색 사각형은 재단 영역, 초록색 사각형은 안전 영역입니다.
// 배경은 재단 영역에 맞추고, 칼선 작업할 이미지는 안전 영역 내에 배치해주세요.

function main() {
    const MM_UNIT = 2.83464567;
    const DESIGN_SUFFIX = "-디자인__YETOPIA__ Image";
    const CUT_SUFFIX = "-칼선__YETOPIA__ Image";

    if (app.documents.length === 0) {
        alert("먼저 문서를 하나 열어주세요.");
        return;
    }

    var abWidthMM = prompt("작업사이즈 가로(mm)를 입력하세요.", "104");
    var abHeightMM = prompt("작업사이즈 세로(mm)를 입력하세요.", "144");
    var abWidth = abWidthMM * MM_UNIT;
    var abHeight = abHeightMM * MM_UNIT;

    var trimWidthMM = prompt("재단사이즈 가로(mm)를 입력하세요.", "100");
    var trimHeightMM = prompt("재단사이즈 세로(mm)를 입력하세요.", "140");
    var trimWidth = trimWidthMM * MM_UNIT;
    var trimHeight = trimHeightMM * MM_UNIT;

    var saftyOffsetMM = prompt("안전선 오프셋(mm)을 입력하세요.\n(0은 만들지 않음)", "3");
    var saftyOffset = -saftyOffsetMM * MM_UNIT;

    var doc = app.activeDocument;

    // 아트보드 중심 좌표 구하기
    var abIndex = doc.artboards.getActiveArtboardIndex();
    var ab = doc.artboards[abIndex];
    var abRect = ab.artboardRect;
    abRect = [
        abRect[0],
        abRect[1],
        abRect[0] + abWidth,
        abRect[1] - abHeight
    ];
    ab.artboardRect = abRect;

    var abLeft = abRect[0];
    var abTop = abRect[1];
    var abRight = abRect[2];
    var abBottom = abRect[3];

    var abWidth = abRight - abLeft;
    var abHeight = abTop - abBottom;

    var abCenterX = (abLeft + abRight) / 2;
    var abCenterY = (abTop + abBottom) / 2;

    // 칼선 레이어 추가
    var cutLayer = doc.layers.add();
    cutLayer.name = "칼선";
    //sendFarBack(cutLayer, doc);

    // 디자인 레이어 추가
    var designLayer = doc.layers.add();
    designLayer.name = "디자인";
    //sendFarBack(designLayer, doc);
    
    var designLayers = [];
    var cutLayers = [];
    var selectedItems = [];
    for (var i = 0; i < doc.layers.length; i++) {
        var layer = doc.layers[i];
        if (!layer.visible)
            continue;
        
        var name = layer.name;

        var basename = removeSubString(name, DESIGN_SUFFIX);
        if (basename != name) {
            layer.name = basename + "-디자인";
            designLayers.push(layer);
        }
        
        basename = removeSubString(name, CUT_SUFFIX);
        if (basename != name) {
            layer.name = basename + "-칼선";
            cutLayers.push(layer);

            var item = layer.pageItems[0];
            if (item.selected)
                selectedItems.push(item);
        }
    }

    // 디자인 레이어 처리
    for (var i = 0; i < designLayers.length; i++) {
        var layer = designLayers[i];
        var item = layer.pageItems[0];
        item.name = layer.name;
        layer.move(designLayer, ElementPlacement.INSIDE);

        //layer.remove();
    }

    // 칼선 레이어 처리
    for (var i = 0; i < cutLayers.length; i++) {
        var layer = cutLayers[i];
        var item = layer.pageItems[0];
        var name = layer.name;

        item.name = name
        layer.move(cutLayer, ElementPlacement.INSIDE);

        //layer.remove();
    }

    // 가이드 레이어 추가
    var guideLayer = doc.layers.add();
    guideLayer.name = "가이드";

    // 절단선 만들기
    var trimRect = guideLayer.pathItems.rectangle(0, 0, trimWidth, trimHeight);
    {
        trimRect.name = "절단선";
    
        // 가운데 정렬
        var trimRectX = abCenterX - (trimRect.width / 2);
        var trimRectY = abCenterY + (trimRect.height / 2);
        trimRect.position = [trimRectX, trimRectY];
    
        var trimRectColor = new CMYKColor();
        trimRectColor.cyan = 0;
        trimRectColor.magenta = 100;
        trimRectColor.yellow = 100;
        trimRectColor.black = 0;
        applyColorForPathItem(trimRect, trimRectColor, null);
    }

    // 안전선 만들기
    if (saftyOffset != 0) {
        var safetyRect = trimRect.duplicate();
        safetyRect.name = "안전선";

        var string = '<LiveEffect name="Adobe Offset Path">' + 
        '<Dict data="I jntp 2 R mlim 4 R ofst ' + saftyOffset + '"/>' + 
        '</LiveEffect>';
        safetyRect.applyEffect(string);
        
        var safetyRectColor = new CMYKColor();
        safetyRectColor.cyan = 100;
        safetyRectColor.magenta = 0;
        safetyRectColor.yellow = 100;
        safetyRectColor.black = 0;

        safetyRect.filled = false;
        safetyRect.stroked = true;
        applyColorForPathItem(safetyRect, safetyRectColor, null);
    }
    guideLayer.locked = true;

    alert("아트보드 초기화 완료.\n'칼선' 레이어에서 칼선 만들 객체를 선택해주세요.");
}

function sendFarBack(layer, doc) {
    var numLayers = doc.layers.length;
    if (numLayers == 0)
        return;

    var tempLayer = doc.layers[0];
    for (var i = 1; i < numLayers; i++) {
        if (tempLayer == layer)
            tempLayer.zOrder(ZOrderMethod.SENDBACKWARD);
        else
            tempLayer = doc.layer[i];
    }
}

function removeSubString(str, target) {
    var targetIdx = str.lastIndexOf(target);
    var result = (targetIdx > 0) ? str.substring(0, targetIdx) : str;
    return result;
}

function applyColorForPathItem(item, strokeColor, fillColor) {
    if (item.typename === "PathItem") {
        if (strokeColor == null) {
            item.stroked = false;
        }
        else {
            item.stroked = true;
            item.strokeColor = strokeColor;
        }

        if (fillColor == null) {
            item.filled = false;
        }
        else {
            item.filled = true;
            item.fillColor = fillColor;
        }
    } else if (item.typename === "CompoundPathItem") {
        for (var j = 0; j < item.pathItems.length; j++) {
            applyColorForPathItem(item.pathItems[j], strokeColor, fillColor);
        }
    } else if (item.typename === "GroupItem") {
        for (var k = 0; k < item.pageItems.length; k++) {
            applyColorForPathItem(item.pageItems[k], strokeColor, fillColor);
        }
    }
}

main();