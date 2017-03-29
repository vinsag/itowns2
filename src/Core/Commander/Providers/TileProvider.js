/*
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */

/*
 * A Faire
 * Les tuiles de longitude identique ont le maillage et ne demande pas 1 seule calcul pour la génération du maillage
 *
 *
 *
 *
 */

import Provider from './Provider';
import Projection from '../../Geographic/Projection';
import BuilderEllipsoidTile from '../../../Globe/BuilderEllipsoidTile';
import { SIZE_TEXTURE_TILE } from './WMTS_Provider';
import TileGeometry from '../../../Globe/TileGeometry';

function TileProvider() {
    Provider.call(this, null);

    this.projection = new Projection();
    this.builder = new BuilderEllipsoidTile(this.projection);

    this.nNode = 0;
}

TileProvider.prototype = Object.create(Provider.prototype);

TileProvider.prototype.constructor = TileProvider;

TileProvider.prototype.executeCommand = function executeCommand(command) {
    var bbox = command.bbox;

    var parent = command.requester;

    // build tile
    var params = {
        bbox,
        level: (command.level === undefined) ? (parent.level + 1) : command.level,
        segment: 16,
    };

    const geometry = new TileGeometry(params, this.builder);

    var tile = new command.type(geometry, params);

    tile.setUuid(this.nNode++);
    tile.link = parent.link;

    // The geometric error is calculated to have a correct texture display.
    // For the projection of a texture's texel to be less than or equal to one pixel
    tile.geometricError = tile.geometry.boundingSphere.radius / SIZE_TEXTURE_TILE;

    parent.worldToLocal(params.center);

    tile.position.copy(params.center);
    tile.setVisibility(false);

    parent.add(tile);
    tile.updateMatrix();
    tile.updateMatrixWorld();
    tile.OBB().parent = tile;   // TODO: we should use tile.add(tile.OBB())
    tile.OBB().update();

    return Promise.resolve(tile);
};

export default TileProvider;
