<template>
  <div v-if="loading" style="display: flex; flex: 1; align-items: center; justify-content: center">
    <mwc-circular-progress indeterminate></mwc-circular-progress>
  </div>

  <div v-else style="display: flex; flex-direction: column">
    <span v-if="error">Error fetching the todo items: {{error.data.data}}.</span>
    <div v-else-if="hashes && hashes.length > 0" style="margin-bottom: 8px">
      <TodoItemDetail 
        v-for="hash in hashes" 
        :todo-item-hash="hash"
        @todo-item-deleted="fetchTodoItem()"
      >
      </TodoItemDetail>
    </div>
    <span v-else>No todo items found for this author.</span>
  </div>

</template>

<script lang="ts">
import { defineComponent, inject, toRaw, ComputedRef } from 'vue';
import { decode } from '@msgpack/msgpack';
import { AppAgentClient, NewEntryAction, Record, AgentPubKey, EntryHash, ActionHash } from '@holochain/client';
import '@material/mwc-circular-progress';
import TodoItemDetail from './TodoItemDetail.vue';
import { TodosSignal } from './types';

export default defineComponent({
  components: {
    TodoItemDetail
  },
  props: {
    author: {
      type: Object,
      required: true
    }
  },
  data(): { hashes: Array<ActionHash> | undefined; loading: boolean; error: any } {
    return {
      hashes: undefined,
      loading: true,
      error: undefined
    }
  },
  async mounted() {
    if (this.author === undefined) {
      throw new Error(`The author property is required for the MyTodos element`);
    }

    await this.fetchTodoItem();
    toRaw(this.client).on('signal', signal => {
      if (signal.zome_name !== 'todos') return; 
      const payload = signal.payload as TodosSignal;
      if (payload.type !== 'EntryCreated') return;
      if (payload.app_entry.type !== 'TodoItem') return;
      if (this.author.toString() !== this.client.myPubKey.toString()) return;
      if (this.hashes) this.hashes.push(payload.action.hashed.hash);
    });
  },
  methods: {
    async fetchTodoItem() {
      try {
        const records: Array<Record> = await this.client.callZome({
          cap_secret: null,
          role_name: 'todos',
          zome_name: 'todos',
          fn_name: 'get_my_todos',
          payload: this.author,
        });
        this.hashes = records.map(r => r.signed_action.hashed.hash);
      } catch (e) {
        this.error = e;
      }
      this.loading = false;
    }
  },
  setup() {
    const client = (inject('client') as ComputedRef<AppAgentClient>).value;
    return {
      client,
    };
  },
})
</script>
