export default function updateTreeLayer(initLevel0Nodes, processNode) {
    return function _updateTreeLayer(context, layer, node) {
        if (!node) {
            if (layer.level0Nodes === undefined) {
                initLevel0Nodes(context, layer);
            }
            return layer.level0Nodes;
        }

        return processNode(context, layer, node);
    };
}
