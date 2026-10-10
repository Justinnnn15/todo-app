import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
} from "react-native";

type Task = { id: string; title: string; done: boolean };

export default function Index() {
  const [text, setText] = useState("");
  const [tasks, setTasks] = useState<Task[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);

  const saveTask = () => {
    if (text.trim() === "") return;
    if (editingId) {
      setTasks(tasks.map(t => (t.id === editingId ? { ...t, title: text } : t)));
      setEditingId(null);
    } else {
      setTasks([...tasks, { id: Date.now().toString(), title: text, done: false }]);
    }
    setText("");
  };

  const toggleDone = (id: string) =>
    setTasks(tasks.map(t => (t.id === id ? { ...t, done: !t.done } : t)));

  const deleteTask = (id: string) => setTasks(tasks.filter(t => t.id !== id));

  const startEdit = (task: Task) => {
    setText(task.title);
    setEditingId(task.id);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>My Tasks</Text>
      <View style={styles.row}>
        <TextInput
          style={styles.input}
          placeholder="Enter a task"
          value={text}
          onChangeText={setText}
        />
        <TouchableOpacity style={styles.addBtn} onPress={saveTask}>
          <Text style={styles.btnText}>{editingId ? "Save" : "Add"}</Text>
        </TouchableOpacity>
      </View>
      <FlatList
        data={tasks}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <View style={styles.task}>
            <TouchableOpacity style={{ flex: 1 }} onPress={() => toggleDone(item.id)}>
              <Text style={[styles.taskText, item.done && styles.done]}>{item.title}</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => startEdit(item)}>
              <Text style={styles.link}>Edit</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => deleteTask(item.id)}>
              <Text style={[styles.link, { color: "red" }]}>Delete</Text>
            </TouchableOpacity>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, paddingTop: 60, backgroundColor: "#fff" },
  heading: { fontSize: 28, fontWeight: "bold", marginBottom: 16 },
  row: { flexDirection: "row", marginBottom: 16 },
  input: { flex: 1, borderWidth: 1, borderColor: "#ccc", borderRadius: 8, padding: 10 },
  addBtn: { backgroundColor: "#1f5080", borderRadius: 8, paddingHorizontal: 18, justifyContent: "center", marginLeft: 8 },
  btnText: { color: "#fff", fontWeight: "bold" },
  task: { flexDirection: "row", alignItems: "center", paddingVertical: 12, borderBottomWidth: 1, borderColor: "#eee", gap: 14 },
  taskText: { fontSize: 16 },
  done: { textDecorationLine: "line-through", color: "#999" },
  link: { color: "#1f5080", fontWeight: "600" },
});