<template>
    <div>
        <!--测试-->
        <h1>测试</h1>
        <text>
            <item v-if="i > 3 && i < 9" v-for="(item, i) in items" :key="i" :item="item">
                <div>
                    <test>测试</test>
                </div>
            </item>
            <a>00</a>
        </text>
        <img type="text" />
        <input type="text" >
        <div>
            {{test.foo}}
            <test>
                <a-b>{{test.foo}}</a-b>
                <ab></ab>
            </test>
        </div>
        <div>{{bar}}</div>
        <div class="text" id="1">
            <text class="123" :test="test">
                <div>
                    <input type="text" />
                    <test>
                        <a-b></a-b>
                        <div>{{test.foo}}</div>
                    </test>
                </div>
            </text>
        </div>
    </div>
</template>
<script>
import item from './Item.vue';
import text from './Text.vue';
import test from './Test.vue';
import aB from './AB.vue';
export default {
    components: {
        item,
        text,
        test,
        aB
    },
    data() {
        return {
            items: [
                {},
                {},
                {},
            ],
            test: {
                foo: 0
            },
            bar: 4
        }
    }
}
</script>
<style>
</style>