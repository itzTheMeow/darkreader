import {m} from 'malevic';
import {getContext} from 'malevic/dom';
import type {DevtoolsProps} from '../types';
import type {DynamicThemeFix} from '../../../definitions';
import {parseDynamicThemeFixes, formatDynamicThemeFixes} from '../../../generators/dynamic-theme';
import {Button, TextBox} from '../../controls';
import {ConfigEditor} from './config-editor';

export function DynamicPerSiteEditor(props: DevtoolsProps): Malevic.Child {
    const context = getContext();
    const store = context.getStore({
        errorText: '',
        fixes: [] as DynamicThemeFix[],
        fixesLength: 0,
        search: '',
        currentFix: null as (DynamicThemeFix | null),
    });

    const fixesText = props.devtools.dynamicFixesText;
    const didFixesChange = store.fixesLength !== fixesText.length;
    if (didFixesChange) {
        store.fixes = parseDynamicThemeFixes(fixesText);
        store.fixesLength = fixesText.length;
    }

    function onSearchInput(e: Event) {
        const element = e.target as HTMLInputElement;
        store.search = element.value;
        store.currentFix = null;
        context.refresh();
    }

    const fixText = store.currentFix ? formatDynamicThemeFixes([store.currentFix]) : '';
    const filteredFixes = store.search ? store.fixes.filter(({url}) => url.some((u) => u.includes(store.search))) : store.fixes;

    return (
        <div class="dynamic-per-site">
            <div class="dynamic-per-site__search-wrapper">
                <TextBox class="dynamic-per-site__search-input" type="text" oninput={onSearchInput} placeholder="Search by URL" />
            </div>
            <list class="dynamic-per-site__urls">
                {filteredFixes.map((fix) => {
                    const text = fix.url.join(', ');
                    return <li>
                        <Button
                            class={{
                                'dynamic-per-site__url': true,
                                'dynamic-per-site__url--active': fix === store.currentFix,
                            }}
                            onclick={() => {
                                store.currentFix = fix;
                                context.refresh();
                            }}
                        >
                            {text}
                        </Button>
                    </li>;
                })}
            </list>
            {store.currentFix ? (
                <ConfigEditor
                    text={fixText}
                    apply={async (text) => {
                        const [change] = parseDynamicThemeFixes(text);
                        const index = store.fixes.indexOf(store.currentFix!);
                        store.fixes[index] = change;
                        store.currentFix = change;
                        const config = formatDynamicThemeFixes(store.fixes);
                        await props.actions.applyDevDynamicThemeFixes(config);
                    }}
                    reset={() => {
                        props.actions.resetDevDynamicThemeFixes();
                    }}
                />
            ) : null}
        </div>
    );
}
