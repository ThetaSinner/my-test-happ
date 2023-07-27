import { CallableCell } from '@holochain/tryorama';
import { NewEntryAction, ActionHash, Record, AppBundleSource, fakeActionHash, fakeAgentPubKey, fakeEntryHash, fakeDnaHash } from '@holochain/client';



export async function sampleTodoItem(cell: CallableCell, partialTodoItem = {}) {
    return {
        ...{
	  description: "Lorem ipsum dolor sit amet, consectetur adipiscing elit.",
        },
        ...partialTodoItem
    };
}

export async function createTodoItem(cell: CallableCell, todoItem = undefined): Promise<Record> {
    return cell.callZome({
      zome_name: "todos",
      fn_name: "create_todo_item",
      payload: todoItem || await sampleTodoItem(cell),
    });
}

