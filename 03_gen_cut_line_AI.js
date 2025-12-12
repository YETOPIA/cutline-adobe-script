#target illustrator

// 해당 스크립트는 선택된 이미지에 대해 칼선 작업을 수행합니다.
// 스크립트 실행 전, 칼선 레이어에서 작업할 이미지에 대해 Image Trace 및 Extend를 수동으로 해야 합니다.
//  - Why? 어도비에서 Image Trace의 Ignore Color에 대한 API를 제공해주지 않고 있습니다.
//  - 프리셋을 불러와도 Ignore Color 속성이 무시되어 Illustrator에서 수동으로 Image Trace한 것과 결과가 달라집니다.

function main() {
    const MM_UNIT = 2.83464567;

    var cutFillColor = null;
    // var cutFillColor = new CMYKColor();
    // cutFillColor.cyan = 0;
    // cutFillColor.magenta = 0;
    // cutFillColor.yellow = 0;
    // cutFillColor.black = 0;

    var cutStrokeColor = new CMYKColor();
    cutStrokeColor.cyan = 0;
    cutStrokeColor.magenta = 100;
    cutStrokeColor.yellow = 0;
    cutStrokeColor.black = 0;

    var safetyZoneFillColor = new CMYKColor();
    safetyZoneFillColor.cyan = 0;
    safetyZoneFillColor.magenta = 0;
    safetyZoneFillColor.yellow = 0;
    safetyZoneFillColor.black = 0;

    var doc = app.activeDocument;

    cutLayer = null;
    for (var i = 0; i < doc.layers.length; i++) {
        var layer = doc.layers[i];
        if (layer.name == "칼선") {
            cutLayer = layer;
            break;
        }
    }

    if (cutLayer == null) {
        alert("'칼선' 레이어가 존재하지 않습니다.");
        return;
    }
    
    var selectedGroups = [];
    for (var i = 0; i < cutLayer.layers.length; i++) {
        var layer = cutLayer.layers[i];
        if (layer.groupItems.length == 0)
            continue;
        
        var group = layer.groupItems[0];
        if (group.selected)
            selectedGroups.push(group);
    }

    app.selection = null;
    doc.selection = null;
    for (var i = 0; i < selectedGroups.length; i++) {
        var group = selectedGroups[i];

        // 면은 투명, 선은 마젠타로 설정
        for (var j = 0; j < group.pageItems.length; j++) {
            applyColorForPathItem(group.pageItems[j], cutStrokeColor, cutFillColor);
        }

        var string = '<LiveEffect name="Adobe Offset Path">' + 
        '<Dict data="I jntp 0 R mlim 4 R ofst ' + (1 * MM_UNIT) + '"/>' + 
        '</LiveEffect>';
        group.applyEffect(string);
        
        group.selected = true;
        app.executeMenuCommand("expandStyle");    // Expand Appearance

        var sel = doc.selection;
        if (sel[0].pageItems.length > 1) {
            app.executeMenuCommand("Live Pathfinder Add");
            app.executeMenuCommand("expandStyle");
        }

        var sel = doc.selection;
        var path = sel[0].pageItems[0];
        var dupPath = path.duplicate();
        path.name = "안전영역";
        dupPath.name = "칼선";

        applyColorForPathItem(path, null, safetyZoneFillColor);
        //app.redraw();

        doc.selection = null;
        path.selected = true;

        var string = '<LiveEffect name="Adobe Offset Path">' + 
        '<Dict data="I jntp 0 R mlim 4 R ofst ' + (1.5 * MM_UNIT) + '"/>' + 
        '</LiveEffect>';
        path.applyEffect(string);

        app.selection = null;
    }

    alert("칼선 생성 완료.");
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