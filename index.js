const util = require('@vue/component-compiler-utils');
const VueTemplateCompiler = require('vue-template-compiler');
const fs = require('fs');

const source = fs.readFileSync('./index.vue', 'utf8');

let result = util.parse({
    source: source,
    compiler: VueTemplateCompiler,
    needMap: false
});

// 提取components
let scriptStr = result.script.content;
let componentListReg = /components\s*:\s*\{((?:\s*\w+,*)+\s*)\}/m;
let str = componentListReg.exec(scriptStr)[1];
let componentReg = /\s*(\w+),*/g;
let componentList = [];
let temp = null;

while((temp = componentReg.exec(str)) !== null) {
    componentList.push(temp[1].toLowerCase());
}

let res = getComponentStructure(result.template.content, componentList);
fs.writeFileSync('b.html', res, 'utf8');

let r = util.compileTemplate({
    source: res,
    compiler: VueTemplateCompiler
});

fs.writeFileSync('a.js', r.code, 'utf8');

function getComponentStructure (source, componentList) {
    const ncname = '[0-9a-zA-Z_][\\w\\-]*';
    const qnameCapture = '((?:' + ncname + '\\:)?' + ncname + ')';
    const startTagOpen = new RegExp('<' + qnameCapture);
    // 中间可能换行，需要加上空字符匹配
    // 需要考虑如 input 这类标签的闭合
    const startTagClose = /^\s*\/?>/;

    const attributeName = /\s*([^\s"'<>\/=]+)/;
    const attributeValue = /(?:\s*(=)\s*(?:"([^"]*)"+|'([^']*)'+|([^\s"'=<>`]+)))?/;
    const attribute = new RegExp(attributeName.source + attributeValue.source); 
    
    // 非贪婪匹配，匹配到最近的一个 > 符
    const endTag = new RegExp('<\\/' + qnameCapture + '[^>]*>');

    let resultStr = source;
    let html = source;
    const stack = [];

    let startOpen;
    let startClose;
    let end;
    let tag;
    let attr;
    let componentLevel = 0;

    while(html) {
        startOpen = html.match(startTagOpen);
        
        end = html.match(endTag);

        if (startOpen || end) {

            // 先碰到开始标签，入栈
            if ((startOpen && !end) || (startOpen && end && startOpen.index < end.index)) {
                tag = startOpen[1].replace('-', '');
                html = html.substring(startOpen.index + startOpen[0].length);
                // 进栈
                stack.push(tag);

                if (componentList.indexOf(tag) >= 0) {
                    // 记录当前component所在的层级
                    componentLevel = stack.length;
                }

                // 找到闭合，去掉目前为止匹配的字符串
                while (!(startClose = html.match(startTagClose)) && (attr = html.match(attribute))) {
                    html = html.substring(attr[0].length)
                }
                html = html.substring(startClose.index + startClose[0].length);

            } else if (end) {
                tag = end[1].replace('-', '');
                let isComponent = componentList.indexOf(tag) >= 0;

                //  componentLevel === stack.length 成立时才说明当前栈中都是最近进栈的component的父级
                if (!isComponent && componentLevel < stack.length) {

                    // 不是component并且没有component后代，在源串中删除
                    resultStr = deleteStr(end[1], resultStr, html);
                    
                } else {
                    componentLevel--;
                }

                // 去掉目前为止匹配的字符串
                html = html.substring(end.index + end[0].length);

                // 出栈
                // 考虑栈中存在没有结束标签的元素 eg: input，从源串中删除
                let popEle;
                while((popEle = stack.pop()) !== tag) {
                    resultStr = resultStr.replace(new RegExp('<' + popEle + '[^(?:\/?>)]*\/?>', 'g'), '');
                }
            }
        } else {
            break;
        }
    }
    return resultStr;
}

/*
** html 中找第一个结束tag
** tempStr 中找最后一个开始tag
** 中间部分是要删除的部分
*/
function deleteStr(tagName, resultStr, html) {
    let delStart;
    let delEnd;
    let startTag = '<' + tagName;
    let endTag = '</' + tagName + '>';
    let tempStr = resultStr.replace(html, '');

    delStart = tempStr.lastIndexOf(startTag);
    delEnd = tempStr.length + html.indexOf(endTag) + endTag.length;

    return resultStr.replace(resultStr.substring(delStart, delEnd), '');
}