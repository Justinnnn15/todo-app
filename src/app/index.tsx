import { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  FlatList,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
} from "react-native";
import * as SQLite from "expo-sqlite";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useFonts, BebasNeue_400Regular } from "@expo-google-fonts/bebas-neue";

const CATEGORIES = ["General", "School", "Work", "Personal"];

type Task = {
  id: number;
  title: string;
  done: boolean;
  category: string;
  dueDate: string | null;
};
type Row = {
  id: number;
  title: string;
  done: number;
  category: string;
  due_date: string | null;
};

const toDateString = (d: Date) => {
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
};
const parseDate = (s: string) => new Date(s + "T00:00:00");
const prettyDate = (s: string) =>
  parseDate(s).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });

export default function Index() {
  const [fontsLoaded] = useFonts({ BebasNeue_400Regular });
  const db = useRef<SQLite.SQLiteDatabase | null>(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState("");

  const [tasks, setTasks] = useState<Task[]>([]);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All");

  const [showForm, setShowForm] = useState(false);
  const [text, setText] = useState("");
  const [category, setCategory] = useState("General");
  const [dueDate, setDueDate] = useState<string>("");
  const [showPicker, setShowPicker] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  const loadTasks = async () => {
    if (!db.current) return;
    let sql = "SELECT * FROM tasks WHERE title LIKE ?";
    const params: string[] = [`%${search.trim()}%`];
    if (filter !== "All") {
      sql += " AND category = ?";
      params.push(filter);
    }
    sql +=
      " ORDER BY done, CASE WHEN due_date IS NULL THEN 1 ELSE 0 END, due_date, id";
    const rows = await db.current.getAllAsync<Row>(sql, params);
    setTasks(
      rows.map(r => ({
        id: r.id,
        title: r.title,
        done: r.done === 1,
        category: r.category,
        dueDate: r.due_date,
      }))
    );
  };

  useEffect(() => {
    (async () => {
      try {
        const d = await SQLite.openDatabaseAsync("tasks.db");
        await d.execAsync(
          `CREATE TABLE IF NOT EXISTS tasks (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            done INTEGER NOT NULL DEFAULT 0
          );`
        );
        const cols = await d.getAllAsync<{ name: string }>("PRAGMA table_info(tasks)");
        const names = cols.map(c => c.name);
        if (!names.includes("category")) {
          await d.execAsync(
            "ALTER TABLE tasks ADD COLUMN category TEXT NOT NULL DEFAULT 'General';"
          );
        }
        if (!names.includes("due_date")) {
          await d.execAsync("ALTER TABLE tasks ADD COLUMN due_date TEXT;");
        }
        db.current = d;
        setReady(true);
      } catch (e) {
        console.log(e);
        setError("Database could not start. Try this on your phone.");
      }
    })();
  }, []);

  useEffect(() => {
    if (ready) loadTasks();
  }, [ready, search, filter]);

  const closeForm = () => {
    Keyboard.dismiss();
    setText("");
    setCategory("General");
    setDueDate("");
    setShowPicker(false);
    setEditingId(null);
    setShowForm(false);
  };

  const saveTask = async () => {
    if (text.trim() === "" || !db.current) return;
    const due = /^\d{4}-\d{2}-\d{2}$/.test(dueDate) ? dueDate : null;
    if (editingId !== null) {
      await db.current.runAsync(
        "UPDATE tasks SET title = ?, category = ?, due_date = ? WHERE id = ?",
        [text.trim(), category, due, editingId]
      );
    } else {
      await db.current.runAsync(
        "INSERT INTO tasks (title, done, category, due_date) VALUES (?, 0, ?, ?)",
        [text.trim(), category, due]
      );
    }
    await loadTasks();
    closeForm();
  };

  const toggleDone = async (task: Task) => {
    if (!db.current) return;
    await db.current.runAsync("UPDATE tasks SET done = ? WHERE id = ?", [
      task.done ? 0 : 1,
      task.id,
    ]);
    await loadTasks();
  };

  const deleteTask = async (id: number) => {
    if (!db.current) return;
    await db.current.runAsync("DELETE FROM tasks WHERE id = ?", [id]);
    await loadTasks();
  };

  const startEdit = (task: Task) => {
    setText(task.title);
    setCategory(task.category);
    setDueDate(task.dueDate ?? "");
    setEditingId(task.id);
    setShowForm(true);
  };

  if (!fontsLoaded) return null;

  const today = toDateString(new Date());
  const pickerValue = /^\d{4}-\d{2}-\d{2}$/.test(dueDate)
    ? parseDate(dueDate)
    : new Date();

  const footer = showForm ? (
    <View style={styles.form}>
      <TextInput
        style={styles.input}
        placeholder="Enter a task"
        placeholderTextColor="#999"
        value={text}
        onChangeText={setText}
      />

      <View style={styles.chipRow}>
        {CATEGORIES.map(c => (
          <Pressable
            key={c}
            onPress={() => setCategory(c)}
            style={[styles.chip, category === c && styles.chipActive]}
          >
            <Text style={[styles.chipText, category === c && styles.chipTextActive]}>
              {c}
            </Text>
          </Pressable>
        ))}
      </View>

      {Platform.OS === "web" ? (
        <TextInput
          style={styles.input}
          placeholder="Due date (YYYY-MM-DD)"
          placeholderTextColor="#999"
          value={dueDate}
          onChangeText={setDueDate}
        />
      ) : (
        <View style={styles.dateRow}>
          <Pressable
            style={[styles.btn, styles.cancelBtn, { flex: 1 }]}
            onPress={() => {
              Keyboard.dismiss();
              setShowPicker(!showPicker);
            }}
          >
            <Text style={styles.cancelText}>
              {dueDate ? `Due: ${prettyDate(dueDate)}` : "Set due date"}
            </Text>
          </Pressable>
          {dueDate !== "" && (
            <Pressable onPress={() => setDueDate("")}>
              <Text style={[styles.link, { color: "#d64545" }]}>Clear</Text>
            </Pressable>
          )}
        </View>
      )}

      {showPicker && Platform.OS !== "web" && (
        <DateTimePicker
          value={pickerValue}
          mode="date"
          display={Platform.OS === "ios" ? "inline" : "default"}
          onChange={(_, selected) => {
            setShowPicker(Platform.OS === "ios");
            if (selected) setDueDate(toDateString(selected));
          }}
        />
      )}

      <View style={styles.formButtons}>
        <Pressable
          style={({ pressed }) => [
            styles.btn,
            styles.cancelBtn,
            pressed && styles.btnPressed,
          ]}
          onPress={closeForm}
        >
          <Text style={styles.cancelText}>Cancel</Text>
        </Pressable>
        <Pressable
          style={({ pressed }) => [styles.btn, pressed && styles.btnPressed]}
          onPress={saveTask}
        >
          <Text style={styles.btnText}>
            {editingId !== null ? "Save Task" : "Add Task"}
          </Text>
        </Pressable>
      </View>
    </View>
  ) : (
    <Pressable
      style={({ pressed }) => [
        styles.btn,
        styles.newBtn,
        pressed && styles.btnPressed,
      ]}
      onPress={() => {
        Keyboard.dismiss();
        setShowForm(true);
      }}
    >
      <Text style={styles.btnText}>+ New Task</Text>
    </Pressable>
  );

  return (
    <KeyboardAvoidingView style={styles.container} behavior="padding">
      <Text style={styles.title}>My Tasks</Text>
      {error !== "" && <Text style={styles.error}>{error}</Text>}

      <TextInput
        style={[styles.input, { marginBottom: 10 }]}
        placeholder="Search tasks"
        placeholderTextColor="#999"
        value={search}
        onChangeText={setSearch}
      />

      <View style={styles.chipRow}>
        {["All", ...CATEGORIES].map(c => (
          <Pressable
            key={c}
            onPress={() => setFilter(c)}
            style={[styles.chip, filter === c && styles.chipActive]}
          >
            <Text style={[styles.chipText, filter === c && styles.chipTextActive]}>
              {c}
            </Text>
          </Pressable>
        ))}
      </View>

      <FlatList
        style={{ flex: 1 }}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        data={tasks}
        keyExtractor={item => String(item.id)}
        ListHeaderComponent={
          <View style={styles.listHeader}>
            <Text style={styles.listHeaderText}>Tasks:</Text>
          </View>
        }
        ListEmptyComponent={<Text style={styles.empty}>No tasks found</Text>}
        ListFooterComponent={footer}
        renderItem={({ item }) => {
          const overdue = !item.done && item.dueDate !== null && item.dueDate < today;
          return (
            <View style={styles.task}>
              <Pressable style={{ flex: 1 }} onPress={() => toggleDone(item)}>
                <Text style={[styles.taskText, item.done && styles.done]}>
                  {item.title}
                </Text>
                <View style={styles.meta}>
                  <Text style={styles.tag}>{item.category}</Text>
                  {item.dueDate && (
                    <Text style={[styles.due, overdue && styles.overdue]}>
                      Due {prettyDate(item.dueDate)}
                    </Text>
                  )}
                </View>
              </Pressable>
              <Pressable
                style={({ pressed }) => pressed && styles.linkPressed}
                onPress={() => startEdit(item)}
              >
                <Text style={styles.link}>Edit</Text>
              </Pressable>
              <Pressable
                style={({ pressed }) => pressed && styles.linkPressed}
                onPress={() => deleteTask(item.id)}
              >
                <Text style={[styles.link, { color: "#d64545" }]}>Delete</Text>
              </Pressable>
            </View>
          );
        }}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, paddingTop: 60, paddingBottom: 30, backgroundColor: "#f7f9fc" },
  title: { fontFamily: "BebasNeue_400Regular", fontSize: 48, letterSpacing: 2, color: "#1f5080", marginBottom: 16 },
  error: { color: "#d64545", marginBottom: 10 },

  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 12 },
  chip: { paddingVertical: 6, paddingHorizontal: 14, borderRadius: 16, backgroundColor: "#e6eaf0" },
  chipActive: { backgroundColor: "#1f5080" },
  chipText: { color: "#333", fontWeight: "600", fontSize: 13 },
  chipTextActive: { color: "#fff" },

  listHeader: { borderBottomWidth: 2, borderColor: "#1f5080", paddingBottom: 6, marginBottom: 8 },
  listHeaderText: { fontFamily: "BebasNeue_400Regular", fontSize: 22, color: "#1f5080" },
  empty: { color: "#999", textAlign: "center", marginTop: 20, marginBottom: 10 },

  task: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 10,
    paddingVertical: 14,
    paddingHorizontal: 14,
    marginBottom: 8,
    gap: 14,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  taskText: { fontSize: 16, color: "#222" },
  done: { textDecorationLine: "line-through", color: "#aaa" },
  meta: { flexDirection: "row", alignItems: "center", gap: 10, marginTop: 4 },
  tag: { fontSize: 12, color: "#1f5080", backgroundColor: "#e3edf7", paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8, overflow: "hidden" },
  due: { fontSize: 12, color: "#666" },
  overdue: { color: "#d64545", fontWeight: "600" },
  link: { color: "#1f5080", fontWeight: "600" },
  linkPressed: { opacity: 0.5 },

  form: { gap: 10, paddingTop: 10, paddingBottom: 20 },
  dateRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  formButtons: { flexDirection: "row", justifyContent: "flex-end", gap: 8 },
  input: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#d5dce6",
    borderRadius: 10,
    padding: 12,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },

  btn: {
    backgroundColor: "#1f5080",
    borderRadius: 10,
    paddingVertical: 13,
    paddingHorizontal: 20,
    alignItems: "center",
    shadowColor: "#1f5080",
    shadowOpacity: 0.3,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 4,
  },
  newBtn: { marginTop: 4 },
  btnPressed: { opacity: 0.85, transform: [{ scale: 0.97 }] },
  btnText: { color: "#fff", fontWeight: "bold" },
  cancelBtn: { backgroundColor: "#e6eaf0", shadowOpacity: 0, elevation: 0 },
  cancelText: { color: "#333", fontWeight: "bold" },
});