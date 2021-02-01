import Vue from 'vue'

import ModelViewer from '../components/ModelViewer.vue'
import ImageThumb from '../components/ImageThumb.vue'
import ImageViewer from '../components/ImageViewer.vue'

import {degEulerToQuaternion, distance} from '../utils/quaternion'

import models from '../models'

type DataRecord = {
    rx: number,
    ry: number,
    rz: number,
    url: string,
    cx: number,
    cy: number,
    cs: number,
    w: number,
    h: number,
    tags: string[]
};
type SearchResult = {
    url: string;
    w: number;
    h: number;
    flip: boolean;
    cx: number;
    cy: number;
    cs: number;
    match: number;
};

export default class Search extends Vue.extend({
    components: {ModelViewer, ImageThumb, ImageViewer},
    data() {
        return {
            loading: false,
            modelViewerSize: 360,
            models: models,
            data: [] as DataRecord[],
            model: {
                url: models[0].path,
                rotateX: 0,
                rotateY: 0,
                rotateZ: 0,
                zoom: 10,
            },
            keyword: '',
            result: [] as SearchResult[],
            collapseSearchConditions: false,
            large: {
                show: false,
                imageUrl: '',
                flip: false
            }
        };
    },
    computed: {
        tags(): string[] {
            const map: { [tag: string]: boolean } = {};
            this.data.forEach(record => record.tags.forEach(tag => {
                map[tag] = true;
            }));
            return Object.keys(map).sort();
        },
        modelAuthorLink(): string {
            return this.models.find(model => model.path === this.model.url)?.origin || '';
        }
    },
    async mounted() {
        try {
            this.loading = true;
            this.data = (await import('../data')).default;
        } finally {
            this.loading = false;
        }
    },
    methods: {
        search() {
            let data = this.keyword ? this.data.filter(item => item.tags?.includes(this.keyword)) : this.data;
            const direction = degEulerToQuaternion(this.model.rotateX, this.model.rotateY, this.model.rotateZ);
            const result: SearchResult[] = data.map(item => {
                const flip = item.ry * this.model.rotateY < 0; // flip the image horizontally if it can match better
                const rx = item.rx;
                const ry = flip ? -item.ry : item.ry;
                const rz = flip ? -item.rz : item.rz;
                const match = distance(direction, degEulerToQuaternion(rx, ry, rz));
                return {...item, flip, ry, rz, match};
            });
            // first 30 best results
            result.sort((a, b) => a.match - b.match);
            this.result = result.slice(0, Math.min(result.length, 30));
            this.collapseSearchConditions = true;
        },
        show(img: SearchResult) {
            this.large.imageUrl = img.url;
            this.large.flip = img.flip;
            this.large.show = true;
        }
    }
}) {
}
