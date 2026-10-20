<script lang="ts">
 import type {GameState,Journey} from '../config/types';
 import {keepsakeSummary} from '../domain/collection.mjs';
 import AchievementSeal from './AchievementSeal.svelte';
 import ActionButton from './ActionButton.svelte';
 let {state,journey}:{state:GameState;journey:Journey}=$props();
 let summary=$derived(keepsakeSummary(state,journey.id));
 let highlighted=$derived(summary.newBadges.slice(0,2));
</script>
<section class="panel journey-keepsakes" aria-label="本次纪念与下一程" data-keepsake-summary>
 <p class="eyebrow">这一程的新收获</p><h2>把同行，变成纪念。</h2>
 {#if summary.newBadges.length}<p class="new-badges-count" data-new-badge-count>这一程点亮 {summary.newBadges.length} 枚纪念章</p><div class="new-badges">{#each highlighted as badge (badge.id)}<article data-new-badge={badge.id}><div class="new-badge-art"><AchievementSeal id={badge.id}/></div><strong>{badge.name}</strong><span>这一程点亮</span></article>{/each}</div>{#if summary.newBadges.length>highlighted.length}<p class="help">另有 {summary.newBadges.length-highlighted.length} 枚，翻开「我的纪念」查看全部。</p>{/if}{:else}<p>已把这次同行收进纪念册，每一次发现都会留下足迹。</p>{/if}
 <p class="help keepsake-context">按现有规则回看这一程及更早记录；过往旅程可追认新章，不代表当时已授章。</p>
 {#if summary.next}<div class="next-keepsake" data-next-keepsake><h3>下一枚 · {summary.next.name}</h3><p>{summary.next.condition}</p><p class="next-progress">当前进度 · {summary.next.progress}</p></div>{:else}<p>{summary.totalBadges} 枚纪念章都已点亮，下一程换一种做法，再找些新发现。</p>{/if}
 <p class="help album-progress">我的纪念 · 已点亮 {summary.earnedCount} / {summary.totalBadges} 枚</p>
 <div class="actions"><ActionButton label={summary.nextTheme==='observe'?'下一程 · 观察城市':'下一程 · 默契挑战'} action="plan-theme" attrs={{'data-theme':summary.nextTheme}}/><ActionButton label="查看我的纪念" action="album" kind="outline"/></div>
</section>
<style>
.journey-keepsakes h2{font-size:1.2rem;margin:8px 0 12px}.new-badges-count{font-size:.875rem;color:var(--green);font-weight:650;margin:0 0 14px}.new-badges{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px;max-width:300px}.new-badges article{display:flex;flex-direction:column;align-items:center;min-width:0;text-align:center;gap:6px;font-size:.8125rem;overflow-wrap:anywhere}.new-badge-art{width:min(90px,100%)}.new-badges span{font-size:.75rem;color:var(--green)}.keepsake-context{margin-top:14px;font-size:.75rem;line-height:1.7}.next-keepsake{border-top:1px dashed var(--line);margin-top:18px;padding:14px 0}.next-keepsake h3{font-size:.9375rem;margin:0 0 8px}.next-keepsake p{font-size:.8125rem;margin:4px 0}.next-keepsake .next-progress{color:var(--green);font-weight:650}.album-progress{font-size:.75rem}.journey-keepsakes>.actions{margin-top:16px}
</style>
