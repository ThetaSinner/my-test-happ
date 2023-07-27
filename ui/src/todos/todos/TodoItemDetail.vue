<template>
  <div v-if="!loading">
    <div v-if="editing" style="display: flex; flex: 1;">
      <EditTodoItem
        :original-todo-item-hash="todoItemHash"
        :current-record="record!"
        @todo-item-updated="editing = false; fetchTodoItem();"
        @edit-canceled="editing = false"
      ></EditTodoItem>
    </div>
    <div v-else-if="record" style="display: flex; flex-direction: column">
      <div style="display: flex; flex-direction: row">
        <span style="flex: 1"></span>
      
        <mwc-icon-button style="margin-left: 8px" icon="edit" @click="editing = true"></mwc-icon-button>
        <mwc-icon-button style="margin-left: 8px" icon="delete" @click="deleteTodoItem()"></mwc-icon-button>
      </div>

      <div style="display: flex; flex-direction: row; margin-bottom: 16px;">
	<span style="margin-right: 4px"><strong>Description: </strong></span>
 	<span style="white-space: pre-line">{{  todoItem?.description }} </span>
      </div>

    </div>
    
    <span v-else>The requested todo item was not found.</span>
  </div>

  <div v-else style="display: flex; flex: 1; align-items: center; justify-content: center">
    <mwc-circular-progress indeterminate></mwc-circular-progress>
  </div>

  <mwc-snackbar ref="delete-error" leading>
  </mwc-snackbar>
</template>

<script lang="ts">
import { defineComponent, inject, ComputedRef } from 'vue';
import { decode } from '@msgpack/msgpack';
import { AppAgentClient, Record, AgentPubKey, EntryHash, ActionHash, DnaHash } from '@holochain/client';
import { TodoItem } from './types';
import '@material/mwc-circular-progress';
import '@material/mwc-icon-button';
import '@material/mwc-snackbar';
import { Snackbar } from '@material/mwc-snackbar';
import EditTodoItem from './EditTodoItem.vue';

export default defineComponent({
  components: {
    EditTodoItem
  },
  props: {
    todoItemHash: {
      type: Object,
      required: true
    }
  },
  data(): { record: Record | undefined; loading: boolean; editing: boolean; } {
    return {
      record: undefined,
      loading: true,
      editing: false,
    }
  },
  computed: {
    todoItem() {
      if (!this.record) return undefined;
      return decode((this.record.entry as any).Present.entry) as TodoItem;
    }
  },
  async mounted() {
    if (this.todoItemHash === undefined) {
      throw new Error(`The todoItemHash input is required for the TodoItemDetail element`);
    }

    await this.fetchTodoItem();
  },
  methods: {
    async fetchTodoItem() {
      this.loading = true;
      this.record = undefined;

      this.record = await this.client.callZome({
        cap_secret: null,
        role_name: 'todos',
        zome_name: 'todos',
        fn_name: 'get_todo_item',
        payload: this.todoItemHash,
      });

      this.loading = false;
    },
    async deleteTodoItem() {
      try {
        await this.client.callZome({
          cap_secret: null,
          role_name: 'todos',
          zome_name: 'todos',
          fn_name: 'delete_todo_item',
          payload: this.todoItemHash,
        });
        this.$emit('todo-item-deleted', this.todoItemHash);
        this.fetchTodoItem();
      } catch (e: any) {
        const errorSnackbar = this.$refs['delete-error'] as Snackbar;
        errorSnackbar.labelText = `Error deleting the todo item: ${e.data.data}`;
        errorSnackbar.show();
      }
    }
  },
  emits: ['todo-item-deleted'],
  setup() {
    const client = (inject('client') as ComputedRef<AppAgentClient>).value;
    return {
      client
    };
  },
})
</script>
