#target photoshop

// illustrator에서 칼선 작업 전, 칼선을 위한 검은 이미지 생성하는 스크립트입니다.
// 칼선 만들 그룹 레이어를 제외한 모든 레이어는 보이지 않게(숨김 처리) 해주세요.
// 완료 이후, psd 파일을 저장하고 illustrator에서 불러와주세요.
// *주의사항*
//   - 스크립트 실행 전, 아무 레이어를 하나 클릭한 뒤 실행해주세요.

function main() {
    const DESIGN_SUFFIX = "-디자인__YETOPIA__";
    const CUT_SUFFIX = "-칼선__YETOPIA__";

    if (app.documents.length == 0) {
        alert("열려 있는 문서가 없습니다.");
        return;
    }

    var origDoc = app.activeDocument;

    // 문서 복제
    var doc = origDoc.duplicate(origDoc.name + "-cut", false);
    app.activeDocument = doc;

    // 전경색 검은색으로 변경
    app.foregroundColor.rgb.red = 0;
    app.foregroundColor.rgb.green = 0;
    app.foregroundColor.rgb.blue = 0;

    var designLayers = [];

    // 디자인 병합
    for (var i = 0; i < doc.layers.length; i++) {
        var layer = doc.layers[i];
        if (!layer.visible)
            continue;

        doc.activeLayer = layer;
        {
            var name = layer.name;
            var mergedLayer = layer.merge();
            mergedLayer.name = name + DESIGN_SUFFIX;
            designLayers.push(mergedLayer);
        }
        //doc.selection.deselect();
    }

    // 칼선 이미지 만들기 및 칼선 그룹으로 이동
    for (var i = 0; i < designLayers.length; i++) {
        var designLayer = designLayers[i];
        var cutLayer = designLayer.duplicate();
        doc.activeLayer = cutLayer;

        cutLayer.name = removeSubString(designLayer.name, DESIGN_SUFFIX) + CUT_SUFFIX;
        cutLayer.transparentPixelsLocked = true;
        doc.selection.fill(
            app.foregroundColor,
            ColorBlendMode.NORMAL,
            100,
            true
        );
        doc.selection.deselect();

        cutLayer.move(designLayer, ElementPlacement.PLACEAFTER);
    }

    alert("칼선 준비 완료.\n문서 저장 후, illustrator에서 불러와주세요.");
}

function removeSubString(str, target) {
    var targetIdx = str.lastIndexOf(target);
    var result = (targetIdx > 0) ? str.substring(0, targetIdx) : str;
    return result;
}

main();