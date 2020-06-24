
import ForceGraph from 'force-graph';
import * as utilities from '../util/utilities.js';

const GRAPH_HTML_CONTAINER_ID = 'graphContainer';
const NETWORK_GRAPH_DATA_JSON_PATH = 'data/pokemonTypeData.json';
const NODE_IMAGE_DIRECTORY_PATH = './images/nodes/';

// Creating Help/About Dialog box
let helpAboutHtml = '';
helpAboutHtml += `
<div style="margin: 10px 0px 10px 10px; line-height: 2; font-size: 16px; font-family: Arial, Liberation Sans, sans-serif;">
  <div style="padding: 0px 0px 10px 0px;">Interactive network graph visualizing Pokemons and their<br>associated Types.</div>
  <table style="padding: 0px 0px 10px 0px;">
    <tr>
      <td style="padding: 0px 10px 0px 0px; font-weight: bold;">GitHub Pages:</td>
      <td><a target="_blank" href="https://hyssopi.github.io/Pokemon-Type-Network-Graph/" style="color: #0000EE;">Pokemon Type Network Graph</a></td>
    </tr>
    <tr>
      <td style="padding: 0px 10px 0px 0px; font-weight: bold;">Reference link:</td>
      <td>
        <a target="_blank" href="https://bulbapedia.bulbagarden.net/wiki/List_of_Pok%C3%A9mon_by_National_Pok%C3%A9dex_number" style="color: #0000EE;">Bul</a><a target="_blank" href="https://bulbapedia.bulbagarden.net/wiki/List_of_Pokémon_with_form_differences" style="color: #0000EE;">bap</a><a target="_blank" href="https://bulbapedia.bulbagarden.net/wiki/Type" style="color: #0000EE;">ed</a><a target="_blank" href="https://bulbapedia.bulbagarden.net/wiki/Mega_Evolution" style="color: #0000EE;">ia</a>
      </td>
    </tr>
  </table>
  <table>
    <th colspan="2" class="cellBorder">Controls:</th>
    <tr>
      <td class="cellBorder" style="padding: 0px 10px 0px 10px; font-weight: bold;">h</td>
      <td class="cellBorder" style="padding: 0px 5px 0px 5px;">Show/hide <u>H</u>elp/About dialog</td>
    </tr>
    <tr>
      <td class="cellBorder" style="padding: 0px 10px 0px 10px; font-weight: bold;">Esc</td>
      <td class="cellBorder" style="padding: 0px 5px 0px 5px;"><u>Clear</u> node/link highlights</td>
    </tr>
    <tr>
      <td class="cellBorder" style="padding: 0px 10px 0px 10px; font-weight: bold;">Shift / Ctrl</td>
      <td class="cellBorder" style="padding: 0px 5px 0px 5px;">Hold + left mouse click to <u>multiselect</u></td>
    </tr>
    <tr>
      <td class="cellBorder" style="padding: 0px 10px 0px 10px; font-weight: bold;">m</td>
      <td class="cellBorder" style="padding: 0px 5px 0px 5px;">Switch DAG <u>m</u>ode: null, \"radialin\", \"radialout\"</td>
    </tr>
  </table>
</div>
`;
let helpAboutDialog = $(helpAboutHtml).dialog(
{
  dialogClass: 'removeCloseButton',
  title: 'Pokemon Type Network Graph',
  width: 'auto',
  height: 'auto',
  position:
  {
    my: "left top",
    at: "left top",
    of: window
  },
  show:
  {
    effect: "drop",
    duration: 100
  },
  hide:
  {
    effect: "drop",
    duration: 500
  },
  closeOnEscape: false
});

// Reading JSON data for network graph
fetch(NETWORK_GRAPH_DATA_JSON_PATH)
  .then(response =>
  {
    if (response.ok)
    {
      return response.json();
    }
    else
    {
      console.error('Configuration was not ok.');
    }
  })
  .then(rawData =>
  {
    console.log(rawData);
    let processedGraphData = 
    {
      "nodes": translateNodeData(rawData.typeData, rawData.pokemonData),
      "links": translateEdgeData(rawData.pokemonData)
    };
    drawGraph(GRAPH_HTML_CONTAINER_ID, processedGraphData);
  })
  .catch (function(error)
  {
    console.error('Error in fetching: ' + error);
  })

/**
 * Create and return nodes by extracting Pokemon Type and Pokemon data.
 *
 * @param typeData List of Pokemon Types and their properties
 * @param pokemonData List of Pokemons and their properties
 * @return List of nodes used to create network graph
 */
function translateNodeData(typeData, pokemonData)
{
  let nodes = [];
  // Adding Type nodes
  for (let i = 0; i < typeData.length; i++)
  {
    let image = new Image();
    image.src = NODE_IMAGE_DIRECTORY_PATH + typeData[i].imageFilename;
    nodes.push({
      "id": typeData[i].id,
      "name": undefined,
      "label": undefined,
      "image": image,
      "color": typeData[i].color,
      "group": "TYPE"
    });
  }
  // Adding Pokemon nodes
  for (let i = 0; i < pokemonData.length; i++)
  {
    let typeColors = [];
    pokemonData[i].types.forEach(function(typeId)
    {
      typeColors.push(findColorFromTypeId(typeData, typeId));
    });
    
    let image = new Image();
    image.src = NODE_IMAGE_DIRECTORY_PATH + pokemonData[i].imageFilename;
    nodes.push({
      "id": pokemonData[i].id,
      "name": pokemonData[i].name,
      "label": pokemonData[i].description,
      "image": image,
      "color": utilities.calculateAverageColor(typeColors),
      "group": "POKEMON"
    });
  }
  return nodes;
}

/**
 * Create and return edges by extracting Pokemon data.
 *
 * @param pokemonData List of Pokemons and their properties
 * @return List of edges used to create network graph
 */
function translateEdgeData(pokemonData)
{
  let edges = [];
  // Create an edge for each Pokemon and for each of their type(s)
  pokemonData.forEach(function(pokemonDataEntry)
  {
    pokemonDataEntry.types.forEach(function(typeId)
    {
      edges.push({
        source: pokemonDataEntry.id,
        target: typeId
      });
    });
  });
  return edges;
}

// How much to scale the node image to be displayed
const GROUP_TYPE_IMAGE_SCALE_AMOUNT = 0.15;
const GROUP_POKEMON_IMAGE_SCALE_AMOUNT = 0.3;
// How much opacity unselected nodes/edges are, from 1.0 (full) to 0.0 (transparent)
const UNSELECTED_OPACITY = 0.3;
// How much selected node image size should increase by
const SELECTED_NODE_IMAGE_SIZE_MULTIPLIER = 1.1;

// Reference of the ForceGraph
let graph;
// List of nodes and links to highlight
let highlightNodes = [];
let highlightLinks = [];
let isMultiselect = false;
// Directed acyclic graph (DAG) mode to represent the network graph
let dagMode = null;

/**
 * Uses force-graph to draw the network graph as a HTML canvas using the graphData input.
 *
 * @param graphHtmlContainerId HTML container element ID used to draw the network graph
 * @param graphData Data containing nodes and links used to draw the network graph
 */
function drawGraph(graphHtmlContainerId, graphData)
{
  graph = ForceGraph()(document.getElementById(graphHtmlContainerId))
    .width(window.innerWidth - 20)
    .height(window.innerHeight - 20)
    .nodeId('id')
    .nodeLabel(node =>
    {
      return node.label;
    })
    .nodeRelSize(5)
    .onNodeClick(node =>
    {
      // Reset highlight lists if not multiselecting
      if (!isMultiselect)
      {
        highlightNodes.length = 0;
        highlightLinks.length = 0;
      }
      
      // Find the associated edges of the selected node and add it to the highlight list
      let {links} = graph.graphData();
      let associatedLinks = links.filter(link => link.source === node || link.target === node);
      highlightLinks.push(...associatedLinks);
      
      // Find the associated nodes of the other end of the associated edges and add to the highlight list
      let associatedNodes = [];
      associatedLinks.forEach(function(link)
      {
        if (link.source === node)
        {
          associatedNodes.push(link.target);
        }
        else if (link.target === node)
        {
          associatedNodes.push(link.source);
        }
      });
      highlightNodes.push(...associatedNodes);
      
      // Add the selected node itself to be highlighted
      if (node)
      {
        highlightNodes.push(node);
      }
    })
    .nodeCanvasObject((node, ctx, globalScale) =>
    {
      // Crisp edges when zooming in images
      ctx.imageSmoothingEnabled = false;
      
      let scaledWidth = node.image.naturalWidth;
      let scaledHeight = node.image.naturalHeight;
      
      if (node.group === 'TYPE')
      {
        scaledWidth *= GROUP_TYPE_IMAGE_SCALE_AMOUNT;
        scaledHeight *= GROUP_TYPE_IMAGE_SCALE_AMOUNT;
      }
      else if (node.group === 'POKEMON')
      {
        scaledWidth *= GROUP_POKEMON_IMAGE_SCALE_AMOUNT;
        scaledHeight *= GROUP_POKEMON_IMAGE_SCALE_AMOUNT;
      }
      
      // Slightly increase image size for highlighted nodes
      if (highlightNodes.indexOf(node) !== -1)
      {
        scaledWidth *= SELECTED_NODE_IMAGE_SIZE_MULTIPLIER;
        scaledHeight *= SELECTED_NODE_IMAGE_SIZE_MULTIPLIER;
      }
      
      ctx.save();
      
      // Set node images to full opacity if it is to be highlighted or if the highlight node list is empty.
      // Otherwise set the node images to be partially transparent. This is to help reduce clutter and increase visibility for the highlighted nodes.
      if ((highlightNodes.indexOf(node) !== -1) || (highlightNodes.length === 0))
      {
        ctx.globalAlpha = 1.0;
      }
      else
      {
        ctx.globalAlpha = UNSELECTED_OPACITY;
      }
      
      ctx.drawImage(node.image, node.x - scaledWidth / 2, node.y - scaledHeight / 2, scaledWidth, scaledHeight);
      ctx.restore();
      
      if (node.name)
      {
        let label = node.name;
        // Zoom out: globalScale is smaller (<1), Zoom in: globalScale is bigger (>40)
        let fontSize = ((6 / globalScale) < 3) ? 3 : (6 / globalScale);
        ctx.font = ((highlightNodes.indexOf(node) !== -1) ? 'bold' : '') + ` ${fontSize}px Arial, Liberation Sans, sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = 'black';
        const LABEL_OFFSET_Y = 5;
        ctx.fillText(label, node.x, node.y + LABEL_OFFSET_Y);
      }
    })
    .linkCanvasObject((link, ctx, globalScale) =>
    {
      // Ignore unbound links
      if (typeof link.source !== 'object' || typeof link.target !== 'object')
      {
        return;
      }
      
      // Draw link line
      let lineGradient = ctx.createLinearGradient(link.source.x, link.source.y, link.target.x, link.target.y);
      lineGradient.addColorStop(0, link.source.color);
      lineGradient.addColorStop(1, link.target.color);
      
      ctx.beginPath();
      ctx.strokeStyle = lineGradient;
      ctx.moveTo(link.source.x, link.source.y);
      ctx.lineTo(link.target.x, link.target.y);
      
      ctx.lineWidth = (highlightLinks.indexOf(link) === -1) ? 1 / globalScale : 4 / globalScale;
      
      ctx.save();
      ctx.stroke();
      
      // Set links to be partially transparent if not selected to be highlighted and with a non-empty highlight link list.
      if ((highlightLinks.indexOf(link) !== -1) || (highlightLinks.length === 0))
      {
        ctx.globalAlpha = 1.0;
      }
      else
      {
        ctx.globalAlpha = UNSELECTED_OPACITY;
      }
      
      ctx.restore();
    })
    .dagLevelDistance(300)
    .zoom(0.9, 1000)
    .graphData(graphData)
}

// Prevent default behavior of right click mouse button
document.addEventListener('contextmenu', function(event)
{
  event.preventDefault();
});

// Add key listeners for when user presses key and when user lifts key
window.addEventListener("keydown", keydownResponse, false);
window.addEventListener("keyup", keyupResponse, false);

/**
 * Behavior when key button on keyboard is first pressed down.
 *
 * @param event Key activity event
 */
function keydownResponse(event)
{
  if (event.keyCode === 27)
  {
    // ESC button pressed
    highlightNodes.length = 0;
    highlightLinks.length = 0;
  }
  if (event.keyCode === 16 || event.keyCode === 17)
  {
    // Shift or Ctrl button pressed
    isMultiselect = true;
  }
  if (event.keyCode === 72)
  {
    // 'h' button pressed
    toggleHelpAboutPopUp(helpAboutDialog);
  }
  if (event.keyCode === 77)
  {
    // 'm' button pressed
    if (dagMode === null)
    {
      dagMode = 'radialin';
    }
    else if (dagMode === 'radialin')
    {
      dagMode = 'radialout';
    }
    else if (dagMode === 'radialout')
    {
      dagMode = null;
    }
    graph.dagMode(dagMode);
  }
}

/**
 * Behavior when key button on keyboard is lifted up.
 *
 * @param event Key activity event
 */
function keyupResponse(event)
{
  if (event.keyCode === 16 || event.keyCode === 17)
  {
    // Shift or Ctrl button lifted
    isMultiselect = false;
  }
}

/**
 * Show/hide the Help/About dialog pop-up.
 *
 * @param helpAboutDialog Reference to the jQuery UI dialog
 */
function toggleHelpAboutPopUp(helpAboutDialog)
{
  if ($(helpAboutDialog).dialog('isOpen'))
  {
    $(helpAboutDialog).dialog('close');
  }
  else
  {
    $(helpAboutDialog).dialog('open');
  }
}

/**
 * Find specified Type's color from list of Types.
 *
 * @param typeData List of Types to search through
 * @param typeId Specified Type to find
 * @return Color of specified Type
 */
function findColorFromTypeId(typeData, typeId)
{
  for (let i = 0; i < typeData.length; i++)
  {
    if (typeData[i].id === typeId)
    {
      return typeData[i].color;
    }
  }
}
