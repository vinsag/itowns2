/**
 * Generated On: 2015-10-5
 * Class: Plane
 * Description: Le Plane est le noeud du Plane (node) principale.
 */

define('Plane/Plane', [
    'Core/defaultValue',
    'Scene/Layer',
    'Scene/Quadtree',
    'Scene/SchemeTile',
    'Core/Math/MathExtented',
    'Globe/TileMesh',
    'Core/Geographic/CoordCarto',
    'Renderer/BasicMaterial',
    'THREE'
], function(defaultValue, Layer, Quadtree, SchemeTile, MathExt,
    TileMesh, CoordCarto, BasicMaterial, THREE) {

    function Plane(parameters, gLDebug) {
        //Constructor

        Layer.call(this);

        this.gLDebug = gLDebug;

        this.batiments = new Layer();
        this.layerWGS84Zup = new Layer();

        this.tiles = new Quadtree(TileMesh, this.SchemeTileWMTS(1, parameters.bbox));

        // PROBLEM is not generic : elevationTerrain ,colorTerrain
        this.elevationTerrain = new Layer();
        this.colorTerrain = new Layer();

        this.elevationTerrain.description = {style:{layerTile:0}};
        this.colorTerrain.description = {style:{layerTile:1}};

        this.tiles.add(this.elevationTerrain);
        this.tiles.add(this.colorTerrain);

        this.add(this.tiles);
    }

    Plane.prototype = Object.create(Layer.prototype);

    Plane.prototype.constructor = Plane;

    Plane.prototype.SchemeTileWMTS = function(type, bbox) {
        //TODO: Implement Me
        if (type === 1) {
            var schemeT = new SchemeTile();
            schemeT.add(bbox.minCarto.longitude, bbox.maxCarto.longitude, bbox.minCarto.latitude, bbox.maxCarto.latitude);
            return schemeT;
        }

    };

    return Plane;

});
