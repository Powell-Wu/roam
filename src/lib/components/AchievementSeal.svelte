<script lang="ts">
 import {asset} from '../config/assets';
 import {achievementArt} from '../ui/achievement-art.mjs';
 let {id}:{id:string}=$props();
 let art=$derived(achievementArt(id));
 let position=$derived(`${art.columns>1?art.index%art.columns/(art.columns-1)*100:0}% ${art.rows>1?Math.floor(art.index/art.columns)/(art.rows-1)*100:0}%`);
</script>
<span class="achievement-seal" aria-hidden="true" data-achievement-seal={id} style:background-image={`url("${asset(art.src)}")`} style:background-size={`${art.columns*100}% ${art.rows*100}%`} style:background-position={position}></span>
<style>
 .achievement-seal{display:block;width:100%;aspect-ratio:1;background-repeat:no-repeat;image-rendering:pixelated;mix-blend-mode:multiply;pointer-events:none}
</style>
