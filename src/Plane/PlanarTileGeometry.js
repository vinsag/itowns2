/**
 * Generated On: 2015-10-5
 * Class: PlanarTileGeometry
 * Description: Tuile géométrique. Buffer des vertex et des faces
 */

define('Globe/PlanarTileGeometry', [
    'THREE',
    'Core/defaultValue',
    'Core/Math/MathExtented',
    'Core/System/JavaTools',
    'Core/Commander/Providers/CacheRessource'
], function(
    THREE,
    defaultValue,
    MathExt,
    JavaTools,
    CacheRessource
    ) {

    "use strict";
    var cache = CacheRessource(); // TODO /!\ singleton


    function Buffers(nSegment)
    {

        this.index = null;
        this.position = null;
        this.normal = null;
        this.uv = null;

        /*var cBuff = cache.getRessource(nSegment);

        if(cBuff)
        {
            this.index = cBuff.index;
            this.uv = cBuff.uv;
        }*/
    }

    function PlanarTileGeometry(params) {
        //Constructor
        THREE.BufferGeometry.call(this);

        params.center = this.center = new THREE.Vector3(params.bbox.center.x, params.bbox.center.y, 0);

        var max = new THREE.Vector3(params.bbox.maxCarto.longitude, params.bbox.maxCarto.latitude, 0);
        var min = new THREE.Vector3(params.bbox.minCarto.longitude, params.bbox.minCarto.latitude, 0);
        var translate = new THREE.Vector3(0,0,0);
        var normal = new THREE.Vector3(0,0,1);
        this.OBB = new THREE.OBB(min, max, normal, translate);

        // TODO : free array

        var buffersAttrib = this.computeBuffers(params);

        this.setIndex(buffersAttrib.index);
        this.addAttribute('position', buffersAttrib.position);
        this.addAttribute('normal', buffersAttrib.normal);
        this.addAttribute('uv', buffersAttrib.uv);
        //this.addAttribute('uv1', buffersAttrib.uv_1);

        buffersAttrib.position = null;
        buffersAttrib.normal= null;
        //buffersAttrib.uv_1 = null;

        if(!cache.getRessource(params.segment))
            cache.addRessource(params.segment, buffersAttrib);

        // ---> for SSE
        this.computeBoundingSphere();

    }


    PlanarTileGeometry.prototype = Object.create(THREE.BufferGeometry.prototype);

    PlanarTileGeometry.prototype.constructor = PlanarTileGeometry;

    PlanarTileGeometry.prototype.computeBuffers = function(params)
    {
        var javToo = new JavaTools();
        var buffersAttrib = new Buffers(params.segment);
        var buffers = new Buffers();

        var nSeg = defaultValue(params.segment, 32);
        var nVertex = 4;
        var triangles = 2;

        buffers.position = new Float32Array(nVertex * 3);
        buffers.bufferIndex = new Uint32Array(triangles * 3 * 2);
        buffers.normal = new Float32Array(nVertex * 3);
        buffers.uv = new Float32Array(nVertex * 2);

        var widthSegments = 1;
        var heightSegments = 1;

        var idVertex = 0;
        var x, y, vertices = [],
            skirt = [],
            skirtEnd = [];
        var u,v;

        var sizeX = params.bbox.maxCarto.longitude - params.bbox.minCarto.longitude;
        var sizeY = params.bbox.maxCarto.latitude - params.bbox.minCarto.latitude;


        for (y = 0; y <= heightSegments; y++) {

            var verticesRow = [];

            v = y / heightSegments;

            for (x = 0; x <= widthSegments; x++) {

                u = x / widthSegments;

                var id_m3 = idVertex * 3;

                buffers.position[id_m3 + 0] = u * sizeX - 0.5 * sizeX;
                buffers.position[id_m3 + 1] = v * sizeY - 0.5 * sizeY;
                buffers.position[id_m3 + 2] = 0;

                buffers.normal[id_m3 + 0] = 0;
                buffers.normal[id_m3 + 1] = 0;
                buffers.normal[id_m3 + 2] = 1;

                buffers.uv[idVertex * 2 + 0] = u;
                buffers.uv[idVertex * 2 + 1] = v;

                /*if (y !== 0 && y !== heightSegments)
                    if (x === widthSegments)
                        skirt.push(idVertex);
                    else if (x === 0)
                    skirtEnd.push(idVertex);*/

                verticesRow.push(idVertex);

                idVertex++;

            }

            vertices.push(verticesRow);

            /*if (y === 0)
                skirt = skirt.concat(verticesRow);
            else if (y === heightSegments)
                skirt = skirt.concat(verticesRow.slice().reverse());*/

        }

        skirt = skirt.concat(skirtEnd.reverse());

        function bufferize(va, vb, vc, idVertex) {
            buffers.bufferIndex[idVertex + 0] = va;
            buffers.bufferIndex[idVertex + 1] = vb;
            buffers.bufferIndex[idVertex + 2] = vc;
            return idVertex+3;
        }

        var idVertex2 = 0;

        if(buffersAttrib.index === null)
            for (y = 0; y < heightSegments; y++) {

                for (x = 0; x < widthSegments; x++) {

                    var v1 = vertices[y][x + 1];
                    var v2 = vertices[y][x];
                    var v3 = vertices[y + 1][x];
                    var v4 = vertices[y + 1][x + 1];

                    idVertex2 = bufferize(v4, v2, v1, idVertex2);
                    idVertex2 = bufferize(v4, v3, v2, idVertex2);

                }
            }

        /*var iStart = idVertex;
        var rmax = 5000;
        var r = Math.max(rmax, Math.pow(rmax, 1 / params.zoom));

        r = isFinite(r) ? r : rmax;

        var buildIndexSkirt = function(){};
        var buildUVSkirt = function(){};


        if(buffersAttrib.index === null)
        {
            buildIndexSkirt = function(id,v1,v2,v3,v4)
            {
                id = bufferize(v1, v2, v3, id);
                id = bufferize(v1, v3, v4, id);
                return id;
            };

            buildUVSkirt = function(){
                buffers.uv[idVertex * 2 + 0] = buffers.uv[id * 2 + 0];
                buffers.uv[idVertex * 2 + 1] = buffers.uv[id * 2 + 1];
            };
        }


        for (var i = 0; i < skirt.length; i++) {

            var id = skirt[i];
            id_m3 = idVertex * 3;
            var id2_m3 = id * 3;

            buffers.position[id_m3 + 0] = buffers.position[id2_m3 + 0] - buffers.normal[id2_m3 + 0] * r;
            buffers.position[id_m3 + 1] = buffers.position[id2_m3 + 1] - buffers.normal[id2_m3 + 1] * r;
            buffers.position[id_m3 + 2] = buffers.position[id2_m3 + 2] - buffers.normal[id2_m3 + 2] * r;

            buffers.normal[id_m3 + 0] = buffers.normal[id2_m3 + 0];
            buffers.normal[id_m3 + 1] = buffers.normal[id2_m3 + 1];
            buffers.normal[id_m3 + 2] = buffers.normal[id2_m3 + 2];

            buildUVSkirt();

            var idf = (i + 1) % skirt.length;

            v1 = id;
            v2 = idVertex;
            v3 = idVertex + 1;
            v4 = skirt[idf];

            if (idf === 0)
                v3 = iStart;

            idVertex2 = buildIndexSkirt (idVertex2,v1,v2,v3,v4);

            idVertex++;

        }*/
         // TODO : free array

        buffersAttrib.index = new THREE.BufferAttribute(buffers.bufferIndex, 1);
        buffersAttrib.position = new THREE.BufferAttribute(buffers.position, 3);
        buffersAttrib.normal= new THREE.BufferAttribute(buffers.normal, 3);
        buffersAttrib.uv = new THREE.BufferAttribute(buffers.uv, 2);

        javToo.freeArray(vertices);

        buffers.position = null;
        buffers.bufferIndex = null;
        buffers.normal = null;
        buffers.uv = null;

        return buffersAttrib;

    };

    return PlanarTileGeometry;

});
