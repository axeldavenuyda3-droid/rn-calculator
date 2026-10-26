import React, { useState } from 'react';
import {
  View,
  Text,
  Pressable,
  FlatList,
  StyleSheet,
  useColorScheme,
  StatusBar,
} from 'react-native';

// ---------- Theme (Bonus: dark mode using useColorScheme) ----------
const themes = {
  light: {
    bg: '#EEF2F6',
    display: '#FFFFFF',
    text: '#1B2430',
    subText: '#6B7785',
    key: '#FFFFFF',
    keyPressed: '#D5DEE9',
    op: '#DCE6F7',
    opPressed: '#B9CDEE',
    opText: '#2F5DA8',
    equals: '#E8A33D',
    equalsPressed: '#C98822',
    equalsText: '#1B2430',
    clear: '#F7D9D6',
    clearPressed: '#EDB8B2',
    clearText: '#B3372B',
  },
  dark: {
    bg: '#12161C',
    display: '#1A2028',
    text: '#F1F4F8',
    subText: '#8D99A8',
    key: '#222A35',
    keyPressed: '#33404F',
    op: '#2A3A57',
    opPressed: '#3C5280',
    opText: '#8FB2F5',
    equals: '#E8A33D',
    equalsPressed: '#C98822',
    equalsText: '#12161C',
    clear: '#4A2A2A',
    clearPressed: '#6A3B3B',
    clearText: '#FF9C92',
  },
};

// ---------- Button layout (rendered with .map) ----------
const BUTTONS = [
  { label: 'C', type: 'clear' },
  { label: '⌫', type: 'op' },
  { label: '.', type: 'num' },
  { label: '÷', type: 'op' },
  { label: '7', type: 'num' },
  { label: '8', type: 'num' },
  { label: '9', type: 'num' },
  { label: '×', type: 'op' },
  { label: '4', type: 'num' },
  { label: '5', type: 'num' },
  { label: '6', type: 'num' },
  { label: '−', type: 'op' },
  { label: '1', type: 'num' },
  { label: '2', type: 'num' },
  { label: '3', type: 'num' },
  { label: '+', type: 'op' },
  { label: '0', type: 'num', wide: true },
  { label: '=', type: 'equals', wide: true },
];

const OPERATORS = ['+', '−', '×', '÷'];

// ---------- Math (no eval) ----------
function calculate(a, b, op) {
  const x = parseFloat(a);
  const y = parseFloat(b);
  let result;
  if (op === '+') result = x + y;
  else if (op === '−') result = x - y;
  else if (op === '×') result = x * y;
  else if (op === '÷') {
    if (y === 0) return 'Error';
    result = x / y;
  }
  return String(Number(result.toFixed(10)));
}

// ---------- Component 1: Display ----------
function Display({ expression, value, theme }) {
  return (
    <View style={[styles.display, { backgroundColor: theme.display }]}>
      <Text style={[styles.expression, { color: theme.subText }]} numberOfLines={1}>
        {expression || ' '}
      </Text>
      <Text
        style={[styles.value, { color: theme.text }]}
        numberOfLines={1}
        adjustsFontSizeToFit
      >
        {value}
      </Text>
    </View>
  );
}

// ---------- Component 2: CalcButton ----------
function CalcButton({ label, type, wide, onPress, theme }) {
  const colors = {
    num: { bg: theme.key, pressed: theme.keyPressed, text: theme.text },
    op: { bg: theme.op, pressed: theme.opPressed, text: theme.opText },
    equals: { bg: theme.equals, pressed: theme.equalsPressed, text: theme.equalsText },
    clear: { bg: theme.clear, pressed: theme.clearPressed, text: theme.clearText },
  }[type];

  return (
    <View style={[styles.cell, wide && styles.cellWide]}>
      <Pressable
        onPress={() => onPress(label)}
        style={({ pressed }) => [
          styles.button,
          { backgroundColor: pressed ? colors.pressed : colors.bg },
          pressed && styles.buttonPressed,
        ]}
      >
        <Text style={[styles.buttonText, { color: colors.text }]}>{label}</Text>
      </Pressable>
    </View>
  );
}

// ---------- Component 3: History (Bonus: calculation history list) ----------
function History({ items, theme }) {
  return (
    <View style={styles.history}>
      <FlatList
        data={items}
        keyExtractor={(_, i) => String(i)}
        ListEmptyComponent={
          <Text style={[styles.historyEmpty, { color: theme.subText }]}>
            Walang history pa. Mag-compute muna.
          </Text>
        }
        renderItem={({ item }) => (
          <Text style={[styles.historyItem, { color: theme.subText }]}>{item}</Text>
        )}
      />
    </View>
  );
}

// ---------- Component 4: Calculator (main logic) ----------
function Calculator({ theme }) {
  const [current, setCurrent] = useState('0'); // number being typed / result
  const [prev, setPrev] = useState(null); // stored first number
  const [op, setOp] = useState(null); // pending operator
  const [fresh, setFresh] = useState(false); // next digit starts a new number
  const [history, setHistory] = useState([]);

  const reset = () => {
    setCurrent('0');
    setPrev(null);
    setOp(null);
    setFresh(false);
  };

  const handlePress = (label) => {
    // Digits
    if (/^[0-9]$/.test(label)) {
      setCurrent(fresh || current === '0' || current === 'Error' ? label : current + label);
      setFresh(false);
      return;
    }

    // Decimal point
    if (label === '.') {
      if (fresh || current === 'Error') {
        setCurrent('0.');
        setFresh(false);
      } else if (!current.includes('.')) {
        setCurrent(current + '.');
      }
      return;
    }

    // Clear
    if (label === 'C') {
      reset();
      return;
    }

    // Backspace
    if (label === '⌫') {
      if (fresh || current === 'Error') return;
      setCurrent(current.length > 1 ? current.slice(0, -1) : '0');
      return;
    }

    // Operators (+ − × ÷)
    if (OPERATORS.includes(label)) {
      if (current === 'Error') return;
      let base = current;
      if (prev !== null && op && !fresh) {
        base = calculate(prev, current, op); // chain: 2 + 3 + ...
        if (base === 'Error') {
          reset();
          setCurrent('Error');
          return;
        }
        setCurrent(base);
      }
      setPrev(base);
      setOp(label);
      setFresh(true);
      return;
    }

    // Equals
    if (label === '=') {
      if (prev === null || !op || fresh) return;
      const result = calculate(prev, current, op);
      setHistory([`${prev} ${op} ${current} = ${result}`, ...history]);
      setCurrent(result);
      setPrev(null);
      setOp(null);
      setFresh(true);
    }
  };

  const expression = prev !== null && op ? `${prev} ${op}` : '';

  return (
    <View style={styles.calculator}>
      <History items={history} theme={theme} />
      <Display expression={expression} value={current} theme={theme} />
      <View style={styles.grid}>
        {BUTTONS.map((b) => (
          <CalcButton key={b.label} {...b} onPress={handlePress} theme={theme} />
        ))}
      </View>
    </View>
  );
}

// ---------- App ----------
export default function App() {
  const scheme = useColorScheme();
  const theme = scheme === 'dark' ? themes.dark : themes.light;

  return (
    <View style={[styles.container, { backgroundColor: theme.bg }]}>
      <StatusBar barStyle={scheme === 'dark' ? 'light-content' : 'dark-content'} />
      <Calculator theme={theme} />
    </View>
  );
}

// ---------- Styles ----------
const GAP = 6;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 56,
    paddingHorizontal: 12,
    paddingBottom: 20,
  },
  calculator: {
    flex: 1,
  },
  history: {
    height: 90,
    paddingHorizontal: 8,
    marginBottom: 8,
  },
  historyItem: {
    fontSize: 15,
    textAlign: 'right',
    paddingVertical: 2,
  },
  historyEmpty: {
    fontSize: 14,
    textAlign: 'right',
  },
  display: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    alignItems: 'flex-end',
    justifyContent: 'flex-end',
    minHeight: 110,
  },
  expression: {
    fontSize: 20,
  },
  value: {
    fontSize: 56,
    fontWeight: '600',
  },
  grid: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignContent: 'stretch',
  },
  cell: {
    width: '25%',
    height: '20%',
    padding: GAP / 2,
  },
  cellWide: {
    width: '50%',
  },
  button: {
    flex: 1,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonPressed: {
    transform: [{ scale: 0.97 }],
  },
  buttonText: {
    fontSize: 28,
    fontWeight: '500',
  },
});
    
