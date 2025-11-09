import React, { useState, useEffect } from 'react';
import {
  SafeAreaView,
  ScrollView,
  View,
  Text,
  Pressable,
  StyleSheet,
  useWindowDimensions,
  TextInput,
  Image,
} from 'react-native';

type Student = {
  id: number;
  name: string;
  choices: string[];
  points: number;
  recentChoice?: string;
  showingScore?: boolean;
  selected?: boolean;
};

type MonthlyEquation = {
  trait1: string;
  trait2: string;
  result: string;
  color: string;
};

export default function PathwayBoard() {
  const { width } = useWindowDimensions();
  const isSmall = width < 768;

  // Calculate responsive sizes based on window width
  const cardSize = Math.max(40, Math.min(75, width * 0.055));
  const cardGap = Math.max(4, Math.min(6, width * 0.004));
  const fontSize = Math.max(8, Math.min(10, cardSize * 0.13));
  const headerFontSize = Math.max(14, Math.min(18, width * 0.02));
  const pawsSize = Math.max(45, Math.min(60, width * 0.04));
  const pawsFontSize = Math.max(24, Math.min(32, pawsSize * 0.53));
  const choiceButtonHeight = Math.max(45, Math.min(55, width * 0.04));

  const [students, setStudents] = useState<Student[]>(
    Array.from({ length: 33 }, (_, i) => ({
      id: i + 1,
      name: `Photo Name`,
      choices: [],
      points: 0,
      selected: false,
    }))
  );

  const [teacherName, setTeacherName] = useState('Teacher Name');
  const [classGrade, setClassGrade] = useState('Grade');
  const [selectedChoice, setSelectedChoice] = useState<string>('');
  const [showSettings, setShowSettings] = useState(false);

  // Monthly character equation configuration
  const monthlyEquations: Record<number, MonthlyEquation> = {
    0: { trait1: '+ Goodness', trait2: '+ Skills', result: 'Ability', color: '#ffcdd2' }, // January (red)
    1: { trait1: '+ Hope', trait2: '+ Knowledge', result: 'Discernment', color: '#fff9c4' }, // February (yellow)
    2: { trait1: '+ Respect', trait2: '+ Gentleness', result: 'Friendships', color: '#d9e2f7' }, // March (blue)
    3: { trait1: '+ Self-Control', trait2: '+ Purpose', result: 'Resilience', color: '#ffcdd2' }, // April (red)
    4: { trait1: '', trait2: '', result: '', color: '#fef8dc' }, // May (none)
    5: { trait1: '', trait2: '', result: '', color: '#fef8dc' }, // June (none)
    6: { trait1: '', trait2: '', result: '', color: '#fef8dc' }, // July (none)
    7: { trait1: '+ Helpfulness', trait2: '+ Organization', result: 'Learning Environment', color: '#fff9c4' }, // August (yellow)
    8: { trait1: '+ Care', trait2: '+ Safety', result: 'Stability', color: '#d9e2f7' }, // September (blue)
    9: { trait1: '+ Joy', trait2: '+ Focus', result: 'Learning Energy', color: '#ffcdd2' }, // October (red)
    10: { trait1: '+ Patience', trait2: '+ Excellent Senses', result: 'Perception', color: '#fff9c4' }, // November (yellow)
    11: { trait1: '+ Kindness', trait2: '+ Understanding', result: 'Responsibility', color: '#d9e2f7' }, // December (blue)
  };

  const [characterTrait1, setCharacterTrait1] = useState('');
  const [characterTrait2, setCharacterTrait2] = useState('');
  const [equationResult, setEquationResult] = useState('');
  const [equationBgColor, setEquationBgColor] = useState('#fef8dc');

  // Set character equation based on current month
  useEffect(() => {
    const currentMonth = new Date().getMonth(); // 0-11
    const monthConfig = monthlyEquations[currentMonth];
    
    setCharacterTrait1(monthConfig.trait1);
    setCharacterTrait2(monthConfig.trait2);
    setEquationResult(monthConfig.result);
    setEquationBgColor(monthConfig.color);
  }, []);

  const positiveChoices: string[] = [
    '+ Prepared for Learning',
    '+ Acting Responsibly',
    '+ Working and Playing Respectfully',
    '+ Solving Problems'
  ];

  const negativeChoices: string[] = [
    '- Needs to work on being Prepared for Learning',
    '- Needs to work on Acting Responsibly',
    '- Need to work on Working and Playing Respectfully',
    '- Need to work on Solving Problems'
  ];

  const pawsLetters = ['P', 'A', 'W', 'S'];
  const pawsColors = ['#f4e4a6', '#a8b5e3', '#a8b5e3', '#f4a6a6'];
  const lightPawsColors = ['#fef8dc', '#d9e2f7', '#d9e2f7', '#fdd9d9'];

  const rainbowColors = [
    '#f4a6a6',  // red
    '#ffb366',  // orange
    '#fff9c4',  // yellow
    '#c8e6c9',  // green
    '#a8b5e3',  // blue
    '#d8b4e2',  // purple/violet
  ];

  const isPositiveChoice = (choice: string) => choice.startsWith('+');

  const handleChoiceClick = (choice: string) => {
    if (selectedChoice === choice) {
      setSelectedChoice('');
    } else {
      setSelectedChoice(choice);
    }
  };

  const selectAllStudents = () => {
    if (selectedChoice) {
      const pointChange = isPositiveChoice(selectedChoice) ? 1 : -1;
      
      setStudents((prev) =>
        prev.map((s) => ({
          ...s,
          choices: [...s.choices, selectedChoice],
          points: (s.points || 0) + pointChange,
          recentChoice: selectedChoice,
        }))
      );

      setTimeout(() => {
        setStudents((prev) =>
          prev.map((s) => ({ ...s, recentChoice: undefined }))
        );
      }, 3000);
    }
  };

  const handleStudentClick = (studentId: number) => {
    if (selectedChoice) {
      const pointChange = isPositiveChoice(selectedChoice) ? 1 : -1;
      
      setStudents((prev) =>
        prev.map((s) => 
          s.id === studentId 
            ? { 
                ...s, 
                choices: [...s.choices, selectedChoice],
                points: (s.points || 0) + pointChange,
                recentChoice: selectedChoice,
                showingScore: false
              } 
            : s
        )
      );

      setTimeout(() => {
        setStudents((prev) =>
          prev.map((s) => 
            s.id === studentId 
              ? { ...s, recentChoice: undefined } 
              : s
          )
        );
      }, 3000);
    } else {
      setStudents((prev) =>
        prev.map((s) => 
          s.id === studentId 
            ? { ...s, showingScore: true } 
            : s
        )
      );

      setTimeout(() => {
        setStudents((prev) =>
          prev.map((s) => 
            s.id === studentId 
              ? { ...s, showingScore: false } 
              : s
          )
        );
      }, 3000);
    }
  };

  const getBoxColor = (col: number, row: number) => {
    // Rainbow pattern: each row starts at a different point in the rainbow,
    // then colors flow left to right across the row
    const colorIndex = ((row * 4) + col) % rainbowColors.length;
    return rainbowColors[colorIndex];
  };

  const renderTriangle = () => {
    const rows = [];
    let studentIndex = 0;
    
    rows.push(
      <View key="row-0" style={[styles.triangleRow, { gap: cardGap }]}>
        <Pressable
          onPress={selectAllStudents}
          style={({ pressed }) => [
            styles.triangleCard,
            { 
              backgroundColor: getBoxColor(0, 0),
              width: cardSize,
              height: cardSize,
            },
            pressed && styles.pressed,
          ]}
        >
          <Text style={[styles.triangleCardTitle, { fontSize }]}>Select{'\n'}All{'\n'}Students</Text>
        </Pressable>
      </View>
    );

    rows.push(
      <View key="row-1" style={[styles.triangleRow, { gap: cardGap }]}>
        <View style={[
          styles.triangleCard, 
          { 
            backgroundColor: getBoxColor(0, 1),
            width: cardSize,
            height: cardSize,
          }
        ]}>
          <TextInput
            style={[styles.triangleCardTitle, { fontSize }]}
            value={teacherName}
            onChangeText={setTeacherName}
            placeholder="Teacher Name"
            placeholderTextColor="#000"
            multiline
            textAlign="center"
          />
        </View>
        <View style={[
          styles.triangleCard, 
          { 
            backgroundColor: getBoxColor(1, 1),
            width: cardSize,
            height: cardSize,
          }
        ]}>
          <TextInput
            style={[styles.triangleCardTitle, { fontSize }]}
            value={classGrade}
            onChangeText={setClassGrade}
            placeholder="Class Title"
            placeholderTextColor="#000"
            multiline
            textAlign="center"
          />
        </View>
      </View>
    );

    const rowSizes = [3, 4, 5, 6, 7, 8];
    
    for (let row = 0; row < rowSizes.length; row++) {
      const rowSize = rowSizes[row];
      const rowStudents = [];
      
      for (let col = 0; col < rowSize && studentIndex < 33; col++) {
        const student = students[studentIndex];
        const displayPoints = student.points || 0;
        
        rowStudents.push(
          <Pressable
            key={student.id}
            onPress={() => handleStudentClick(student.id)}
            style={({ pressed }) => [
              styles.triangleCard,
              { 
                backgroundColor: student.recentChoice ? '#000' : getBoxColor(col, row + 2),
                width: cardSize,
                height: cardSize,
              },
              pressed && styles.cardPressed,
            ]}
          >
            {!student.recentChoice && (
              <Text style={[
                styles.triangleCardTitle, 
                { fontSize }
              ]}>
                {student.name}
              </Text>
            )}
            
            {student.showingScore && (
              <View style={styles.scoreOverlay}>
                <Text style={[styles.scoreValue, { fontSize: fontSize * 2 }]}>
                  {displayPoints > 0 ? '+' : ''}{displayPoints}
                </Text>
              </View>
            )}

            {student.recentChoice && (
              <View style={styles.recentChoiceOverlay}>
                <Text style={[styles.recentChoiceText, { fontSize: fontSize * 0.7 }]}>
                  {student.recentChoice}
                </Text>
              </View>
            )}
          </Pressable>
        );
        studentIndex++;
      }
      
      rows.push(
        <View key={`row-${row + 2}`} style={[styles.triangleRow, { gap: cardGap }]}>
          {rowStudents}
        </View>
      );
    }
    
    return rows;
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <View style={styles.headerLeft} />
            <View style={styles.headerCenter}>
              <Text style={[styles.headerText, { fontSize: headerFontSize }]}>
                Our class <Text style={[styles.headerBold, { fontSize: headerFontSize * 1.33 }]}>SMILE Board</Text> helps us become the best learning community we can be!
              </Text>
              <Text style={[styles.headerSubtext, { fontSize: headerFontSize * 0.61 }]}>Student Motivation & Interactive Learning Equations</Text>
            </View>
            <View style={styles.headerRight}>
              <Pressable 
                onPress={() => setShowSettings(!showSettings)}
                style={({ pressed }) => [
                  styles.settingsButton,
                  { width: cardSize, height: cardSize },
                  pressed && styles.pressed
                ]}
              >
                <Text style={[styles.settingsButtonText, { fontSize: cardSize * 0.4 }]}>⚙️</Text>
              </Pressable>
              <View style={[styles.imageSquare, { width: cardSize, height: cardSize }]}>
                <Image 
                  source={require('../../assets/images/dominoeffect.png')}
                  style={styles.dominoImage}
                  resizeMode="contain"
                />
              </View>
            </View>
          </View>
        </View>

        {/* Settings Popup */}
        {showSettings && (
          <View style={styles.settingsOverlay}>
            <View style={styles.settingsPopup}>
              <View style={styles.settingsHeader}>
                <Text style={[styles.settingsTitle, { fontSize: headerFontSize * 1.2 }]}>Settings</Text>
                <Pressable onPress={() => setShowSettings(false)} style={styles.closeButton}>
                  <Text style={[styles.closeButtonText, { fontSize: headerFontSize * 1.5 }]}>×</Text>
                </Pressable>
              </View>
              <View style={styles.settingsContent}>
                <Text style={[styles.settingsText, { fontSize: headerFontSize * 0.9 }]}>Settings options will go here</Text>
              </View>
            </View>
          </View>
        )}

        {/* Main Content */}
        <View style={styles.mainContent}>
          {/* Left Side - Choice Taps */}
          <View style={styles.leftSection}>
            {/* Choice Taps */}
            <View style={styles.choiceTapsSection}>
              {/* Headers Row */}
              <View style={styles.choiceHeaderRow}>
                <View style={[styles.pawsHeaderCell, { width: pawsSize }]} />
                <View style={styles.choiceHeaderCell}>
                  <View style={styles.choiceHeader}>
                    <Text style={[styles.choiceHeaderText, { fontSize: headerFontSize * 0.78 }]}>+ Choice Taps</Text>
                  </View>
                </View>
                <View style={styles.choiceHeaderCell}>
                  <View style={styles.choiceHeader}>
                    <Text style={[styles.choiceHeaderText, { fontSize: headerFontSize * 0.78 }]}>- Choice Taps</Text>
                  </View>
                </View>
              </View>

              {/* PAWS rows */}
              {pawsLetters.map((letter, index) => (
                <View key={index} style={styles.choiceRow}>
                  <View style={[styles.pawsCell, { width: pawsSize }]}>
                    <View style={[styles.pawsBox, { backgroundColor: pawsColors[index], height: choiceButtonHeight }]}>
                      <Text style={[styles.pawsLetter, { fontSize: pawsFontSize }]}>{letter}</Text>
                    </View>
                  </View>
                  <View style={styles.choiceCell}>
                    <Pressable
                      onPress={() => handleChoiceClick(positiveChoices[index])}
                      style={({ pressed }) => [
                        styles.choiceButton,
                        { 
                          backgroundColor: lightPawsColors[index],
                          height: choiceButtonHeight,
                        },
                        selectedChoice === positiveChoices[index] && styles.choiceButtonActivePositive,
                        pressed && styles.pressed,
                      ]}
                    >
                      <Text style={[
                        styles.choiceButtonText,
                        { fontSize: headerFontSize * 0.67 },
                        selectedChoice === positiveChoices[index] && styles.choiceButtonTextActive
                      ]}>
                        {positiveChoices[index]}
                      </Text>
                    </Pressable>
                  </View>
                  <View style={styles.choiceCell}>
                    <Pressable
                      onPress={() => handleChoiceClick(negativeChoices[index])}
                      style={({ pressed }) => [
                        styles.choiceButton,
                        { 
                          backgroundColor: lightPawsColors[index],
                          height: choiceButtonHeight,
                        },
                        selectedChoice === negativeChoices[index] && styles.choiceButtonActiveNegative,
                        pressed && styles.pressed,
                      ]}
                    >
                      <Text style={[
                        styles.choiceButtonText,
                        { fontSize: headerFontSize * 0.67 },
                        selectedChoice === negativeChoices[index] && styles.choiceButtonTextActive
                      ]}>
                        {negativeChoices[index]}
                      </Text>
                    </Pressable>
                  </View>
                </View>
              ))}
            </View>

            {/* Character Equation - Only show if month has an equation */}
            {characterTrait1 && characterTrait2 && (
              <View style={styles.characterEquation}>
                <View style={[styles.equationHeader, { backgroundColor: equationBgColor }]}>
                  <Text style={[styles.equationHeaderText, { fontSize: headerFontSize * 0.65 }]}>This Month's Character Equation:</Text>
                </View>
                
                <View style={styles.equationRowWithSign}>
                  <View style={styles.signTextSpacer} />
                  <Pressable
                    onPress={() => handleChoiceClick(characterTrait1)}
                    style={({ pressed }) => [
                      styles.characterBox,
                      styles.characterBoxWithSign,
                      { backgroundColor: equationBgColor },
                      selectedChoice === characterTrait1 && styles.choiceButtonActivePositive,
                      pressed && styles.pressed,
                    ]}
                  >
                    <Text style={[
                      styles.characterText,
                      { fontSize: headerFontSize * 0.61 },
                      selectedChoice === characterTrait1 && styles.choiceButtonTextActive
                    ]}>
                      {characterTrait1}
                    </Text>
                  </Pressable>
                </View>

                <View style={styles.equationRowWithSign}>
                  <Text style={[styles.signText, { fontSize: pawsFontSize * 0.75 }]}>+</Text>
                  <Pressable
                    onPress={() => handleChoiceClick(characterTrait2)}
                    style={({ pressed }) => [
                      styles.characterBox,
                      styles.characterBoxWithSign,
                      { backgroundColor: equationBgColor },
                      selectedChoice === characterTrait2 && styles.choiceButtonActivePositive,
                      pressed && styles.pressed,
                    ]}
                  >
                    <Text style={[
                      styles.characterText,
                      { fontSize: headerFontSize * 0.61 },
                      selectedChoice === characterTrait2 && styles.choiceButtonTextActive
                    ]}>
                      {characterTrait2}
                    </Text>
                  </Pressable>
                </View>

                <View style={styles.equationRowWithSign}>
                  <Text style={[styles.signText, { fontSize: pawsFontSize * 0.75 }]}>=</Text>
                  <View style={[styles.resultBox, styles.characterBoxWithSign, { backgroundColor: equationBgColor }]}>
                    <Text style={[styles.resultText, { fontSize: headerFontSize * 0.56 }]}>You created an</Text>
                    <Text style={[styles.resultText, { fontSize: headerFontSize * 0.56 }]}>+ Optimal {equationResult}!</Text>
                  </View>
                </View>
              </View>
            )}
          </View>

          {/* Right Side - Triangle */}
          <View style={[styles.triangleContainer, { gap: cardGap }]}>
            {renderTriangle()}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#e8e8e8',
  },
  container: {
    padding: 12,
  },
  header: {
    backgroundColor: '#000',
    padding: 12,
    borderRadius: 10,
    marginBottom: 12,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerLeft: {
    width: 20,
  },
  headerCenter: {
    flex: 1,
  },
  headerRight: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  settingsButton: {
    backgroundColor: '#fff',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#000',
  },
  settingsButtonText: {
    color: '#000',
  },
  imageSquare: {
    backgroundColor: '#fff',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#000',
    overflow: 'hidden',
  },
  dominoImage: {
    width: '100%',
    height: '100%',
  },
  imagePlaceholder: {
    color: '#000',
    fontWeight: '700',
    textAlign: 'center',
  },
  settingsOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  settingsPopup: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    width: '80%',
    maxWidth: 400,
    borderWidth: 3,
    borderColor: '#000',
  },
  settingsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  settingsTitle: {
    fontWeight: '700',
    color: '#000',
  },
  closeButton: {
    padding: 5,
  },
  closeButtonText: {
    color: '#000',
    fontWeight: '700',
  },
  settingsContent: {
    padding: 10,
  },
  settingsText: {
    color: '#000',
  },
  headerText: {
    color: '#fff',
    textAlign: 'center',
  },
  headerBold: {
    fontWeight: '700',
  },
  headerSubtext: {
    color: '#fff',
    textAlign: 'center',
    marginTop: 2,
  },
  mainContent: {
    flexDirection: 'row',
    gap: 12,
  },
  leftSection: {
    flex: 1,
  },
  choiceTapsSection: {
    marginBottom: 12,
  },
  choiceHeaderRow: {
    flexDirection: 'row',
    marginBottom: 8,
    gap: 8,
  },
  pawsHeaderCell: {
  },
  choiceHeaderCell: {
    flex: 1,
  },
  choiceHeader: {
    backgroundColor: '#000',
    padding: 10,
    borderRadius: 25,
    alignItems: 'center',
  },
  choiceHeaderText: {
    color: '#fff',
    fontWeight: '700',
  },
  choiceRow: {
    flexDirection: 'row',
    marginBottom: 8,
    gap: 8,
  },
  pawsCell: {
  },
  pawsBox: {
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#000',
  },
  pawsLetter: {
    fontWeight: '900',
    color: '#000',
  },
  choiceCell: {
    flex: 1,
  },
  choiceButton: {
    borderRadius: 25,
    justifyContent: 'center',
    paddingHorizontal: 12,
    borderWidth: 3,
    borderColor: '#000',
  },
  choiceButtonActivePositive: {
    backgroundColor: '#4caf50',
  },
  choiceButtonActiveNegative: {
    backgroundColor: '#ef4444',
  },
  choiceButtonText: {
    fontWeight: '700',
    color: '#000',
  },
  choiceButtonTextActive: {
    color: '#fff',
  },
  characterEquation: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 8,
    borderWidth: 3,
    borderColor: '#000',
    maxWidth: '85%',
    alignSelf: 'center',
  },
  equationHeader: {
    borderRadius: 20,
    padding: 6,
    marginBottom: 6,
    borderWidth: 2,
    borderColor: '#000',
  },
  equationHeaderText: {
    fontWeight: '700',
    color: '#000',
    textAlign: 'center',
  },
  equationRow: {
    marginBottom: 6,
  },
  equationRowWithSign: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
    gap: 8,
  },
  signText: {
    fontWeight: '900',
    color: '#000',
    width: 30,
  },
  signTextSpacer: {
    width: 30,
  },
  characterBox: {
    borderRadius: 20,
    padding: 8,
    borderWidth: 3,
    borderColor: '#000',
    alignItems: 'center',
  },
  characterBoxWithSign: {
    flex: 1,
  },
  characterText: {
    fontWeight: '700',
    color: '#000',
  },
  resultBox: {
    borderRadius: 20,
    padding: 8,
    borderWidth: 3,
    borderColor: '#000',
    alignItems: 'center',
  },
  resultText: {
    fontWeight: '700',
    color: '#000',
    textAlign: 'center',
  },
  triangleContainer: {
    alignItems: 'flex-end',
  },
  triangleRow: {
    flexDirection: 'row',
  },
  triangleCard: {
    borderRadius: 12,
    padding: 6,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#000',
  },
  triangleCardTitle: {
    fontWeight: '700',
    color: '#000',
    textAlign: 'center',
  },
  triangleCardTitleSelected: {
    color: '#fff',
  },
  cardPressed: {
    opacity: 0.8,
  },
  scoreOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 9,
  },
  scoreValue: {
    fontWeight: '900',
    color: '#000',
  },
  recentChoiceOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 9,
    padding: 4,
  },
  recentChoiceText: {
    fontWeight: '700',
    color: '#fff',
    textAlign: 'center',
  },
  pressed: {
    opacity: 0.7,
  },
});