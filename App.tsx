import React, { useState, useEffect } from 'react';
import {
	SafeAreaView,
	ScrollView,
	View,
	Text,
	Pressable,
	useWindowDimensions,
	TextInput,
	Image,
	Alert,
} from 'react-native';
import Constants from 'expo-constants';
import { styles } from './App.styles';

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
	badge_image: number;
	videoUrl?: string;
};

type PreviousTraitOption = {
	key: string;
	label: string;
	monthIndex: number;
	color: string;
};


export default function PathwayBoard() {
	const { width } = useWindowDimensions();
	const isSmall = width < 768;

	// Backend base URL configuration (prefer env, then app.json extra, then localhost)
	const API_URL: string =
		(Constants as any)?.expoConfig?.extra?.API_URL ||
		(process.env as any)?.EXPO_PUBLIC_API_URL ||
		'http://127.0.0.1:8000';

	// Calculate responsive sizes based on window width
	const cardSize = Math.max(40, Math.min(75, width * 0.055));
	const cardGap = Math.max(4, Math.min(6, width * 0.004));
	const fontSize = Math.max(10, Math.min(13, cardSize * 0.16));
	const headerFontSize = Math.max(18, Math.min(24, width * 0.025));
	const pawsSize = Math.max(45, Math.min(60, width * 0.04));
	const pawsFontSize = Math.max(30, Math.min(40, pawsSize * 0.65));
	const choiceButtonHeight = Math.max(45, Math.min(55, width * 0.04));
	const studentCardSize = cardSize * 1.2;
	const topCardSize = cardSize * 1.2;

	const [students, setStudents] = useState<Student[]>(
		Array.from({ length: 33 }, (_, i) => ({
			id: i + 1,
			name: `Student Name`,
			choices: [],
			points: 0,
			selected: false,
		}))
	);

	const [teacherName, setTeacherName] = useState('Teacher Name');
	const [classGrade, setClassGrade] = useState('Grade');
	const [selectedChoice, setSelectedChoice] = useState<string>('');
	const [showSettings, setShowSettings] = useState(false);
	const [updatingRoster, setUpdatingRoster] = useState(false);
	const [populatingRoster, setPopulatingRoster] = useState(false);
	const [generatingReport, setGeneratingReport] = useState(false);
	const [selectedStudentForReport, setSelectedStudentForReport] = useState<string>('');
	const [showReportDialog, setShowReportDialog] = useState(false);
	const [showClassDialog, setShowClassDialog] = useState(false);
	const [loadingStudents, setLoadingStudents] = useState(false);
	const [availableTables, setAvailableTables] = useState<string[]>([]);
	const [selectedTable, setSelectedTable] = useState<string>('Sheet1');

	// Fetch available class tables from backend
	const fetchAvailableTables = async () => {
		try {
			const res = await fetch(`${API_URL}/students?limit=1`);
			if (!res.ok) throw new Error(`HTTP ${res.status}`);
			const data = await res.json();
			
			// Extract unique table names
			const tables = [...new Set(data.map((item: any) => item.sheet))] as string[];
			setAvailableTables(tables);
			
			// Set first table as default if not already set
			if (tables.length > 0 && !selectedTable) {
				setSelectedTable(tables[0]);
			}
		} catch (err) {
			console.warn('Failed to load available tables:', err);
		}
	};

	// Fetch students from backend and load their tap data
	const fetchStudents = async (tableFilter?: string) => {
		setLoadingStudents(true);
		const targetTable = tableFilter || selectedTable;
		try {
			const res = await fetch(`${API_URL}/students?limit=33`);
			if (!res.ok) throw new Error(`HTTP ${res.status}`);
			const data = await res.json();
			
			// Filter by selected table
			const filteredData = data.filter((item: any) => item.sheet === targetTable);
			
			// Map backend student rows to UI Student type
			const backendStudents = await Promise.all(
				filteredData.map(async (item: any, idx: number) => {
					const studentName = item.row?.fname
						? item.row.fname
						: item.row?.['Student Name']
							? item.row['Student Name']
							: item.row?.name || `Student ${idx + 1}`;
					
					// Fetch tap data for this student
					let points = 0;
					try {
						const tapRes = await fetch(`${API_URL}/taps/student/${encodeURIComponent(studentName)}`);
						if (tapRes.ok) {
							const tapData = await tapRes.json();
							points = (tapData.positive_taps || 0) - (tapData.negative_taps || 0);
						}
					} catch (err) {
						console.warn(`Failed to load taps for ${studentName}:`, err);
					}
					
					return {
						id: idx + 1,
						name: studentName,
						choices: [],
						points: points,
						selected: false,
					};
				})
			);
			
			// Pad or trim to 33 students
			const paddedStudents = Array.from({ length: 33 }, (_, i) => 
				backendStudents[i] || {
					id: i + 1,
					name: `Student ${i + 1}`,
					choices: [],
					points: 0,
					selected: false,
				}
			);
			setStudents(paddedStudents);
		} catch (err) {
			console.warn('Failed to load students from backend:', err);
			// Keep placeholder students on error
		} finally {
			setLoadingStudents(false);
		}
	};

	// Remove automatic fetch on mount. Only fetch after updateRoster.

	// Monthly character equation configuration
	const monthlyEquations: Record<number, MonthlyEquation> = {
		0: { trait1: 'Goodness', trait2: 'Skills', result: 'Ability', color: '#ffcdd2', badge_image: 0, videoUrl: ''}, // January (red)
		1: { trait1: 'Hope', trait2: 'Knowledge', result: 'Discernment', color: '#fff9c4', badge_image: 1, videoUrl: 'https://www.youtube.com/watch?v=XTA39otUUqE' }, // February (yellow)
		2: { trait1: 'Respect', trait2: 'Gentleness', result: 'Friendships', color: '#d9e2f7', badge_image: 2, videoUrl: 'https://www.youtube.com/watch?v=AEG4uPGZv-4&pp=0gcJCQwKAYcqIYzv' }, // March (blue)
		3: { trait1: 'Self-Control', trait2: 'Purpose', result: 'Resilience', color: '#ffcdd2', badge_image: 3, videoUrl: 'https://www.youtube.com/watch?v=QOYXPEbZjJ8' }, // April (red)
		4: { trait1: '', trait2: '', result: '', color: '#fef8dc', badge_image: 3, videoUrl: '' }, // May (none) 
		5: { trait1: '', trait2: '', result: '', color: '#fef8dc', badge_image: 3, videoUrl: '' }, // June (none)
		6: { trait1: '', trait2: '', result: '', color: '#fef8dc', badge_image: 7, videoUrl: '' }, // July (none)
		7: { trait1: 'Helpfulness', trait2: 'Organization', result: 'Learning Environment', color: '#fff9c4', badge_image: 7, videoUrl: '' }, // August (yellow)
		8: { trait1: 'Care', trait2: 'Safety', result: 'Stability', color: '#d9e2f7', badge_image: 8, videoUrl: '' }, // September (blue)
		9: { trait1: 'Joy', trait2: 'Focus', result: 'Learning Energy', color: '#ffcdd2', badge_image: 9, videoUrl: 'https://www.youtube.com/watch?v=fLtcRZJQCJk' }, // October (red)
		10: { trait1: 'Patience', trait2: 'Excellent Senses', result: 'Perception', color: '#fff9c4', badge_image: 10, videoUrl: 'https://www.youtube.com/watch?v=8CoPIRFroPM' }, // November (yellow)
		11: { trait1: 'Kindness', trait2: 'Understanding', result: 'Responsibility', color: '#d9e2f7', badge_image: 11, videoUrl: '' }, // December (blue)
	};

	const SCHOOL_YEAR_START_MONTH = 7; // 0 = January, so 7 = August
	
	type TraitCategory = 'Health' | 'Liberty' | 'Happiness' | 'Other';
	
	function getTraitCategory(color: string): TraitCategory {
		const c = color.toLowerCase();
		if (c === '#fff9c4') return 'Health';     // yellow
		if (c === '#d9e2f7') return 'Liberty';    // blue
		if (c === '#ffcdd2') return 'Happiness';  // red
		return 'Other';
	}

	function buildPreviousTraits(
		currentMonth: number,
		monthly: Record<number, MonthlyEquation>
	): PreviousTraitOption[] {
		// If it's August, there are no previous traits for this school year.
		if (currentMonth === SCHOOL_YEAR_START_MONTH) {
			return [];
		}
	
		const result: PreviousTraitOption[] = [];
		let m = SCHOOL_YEAR_START_MONTH;
	
		// Walk from August up to (but not including) the current month, wrapping across years.
		while (m !== currentMonth) {
			const cfg = monthly[m];
			if (cfg) {
				// "First two traits" → trait1 and trait2, but skip blanks
				if (cfg.trait1) {
					result.push({
						key: `${m}-trait1`,
						label: cfg.trait1,  // uses month NUMBER
						monthIndex: m,
						color: cfg.color,
					});
				}
				if (cfg.trait2) {
					result.push({
						key: `${m}-trait2`,
						label: cfg.trait2,  // uses month NUMBER
						monthIndex: m,
						color: cfg.color,
					});
				}
			}
			m = (m + 1) % 12;
		}
	
		return result;
	}
	

	const badgeImages: Record<number, any> = {
		0: require('./assets/images/january.png'),
		1: require('./assets/images/february.png'),
		2: require('./assets/images/march.png'),
		3: require('./assets/images/april.png'),
		7: require('./assets/images/august.png'),
		8: require('./assets/images/september.png'),
		9: require('./assets/images/october.png'),
		10: require('./assets/images/november.png'),
		11: require('./assets/images/december.png'),
	};

	const [characterTrait1, setCharacterTrait1] = useState('');
	const [characterTrait2, setCharacterTrait2] = useState('');
	const [equationResult, setEquationResult] = useState('');
	const [equationBgColor, setEquationBgColor] = useState('#fef8dc');
	const [equationBadgeImage, setEquationBadgeImage] = useState<number | null>(null);

	const [previousTraits, setPreviousTraits] = useState<PreviousTraitOption[]>([]);
	const [isPreviousTraitDropdownOpen, setIsPreviousTraitDropdownOpen] = useState(false);
	const [selectedPreviousTraitKey, setSelectedPreviousTraitKey] = useState<string | null>(null);

	const selectedPreviousTrait = selectedPreviousTraitKey
	? previousTraits.find((t) => t.key === selectedPreviousTraitKey) || null
	: null;

	// Box color: selected previous trait's color, otherwise fall back to the current equation's color
	const previousTraitBoxColor = selectedPreviousTrait?.color || equationBgColor;


	// Set character equation + previous traits based on current month
	useEffect(() => {
		const currentMonth = new Date().getMonth(); // 0-11
		const monthConfig = monthlyEquations[currentMonth];

		if (monthConfig) {
			setCharacterTrait1(monthConfig.trait1);
			setCharacterTrait2(monthConfig.trait2);
			setEquationResult(monthConfig.result);
			setEquationBgColor(monthConfig.color);
			setEquationBadgeImage(monthConfig.badge_image);
		} else {
			// Fallback safety
			setCharacterTrait1('');
			setCharacterTrait2('');
			setEquationResult('');
			setEquationBgColor('#fef8dc');
			setEquationBadgeImage(null);
		}

		// Build list of previous character equation traits for the school year
		const prev = buildPreviousTraits(currentMonth, monthlyEquations);
		setPreviousTraits(prev);
		setSelectedPreviousTraitKey(null);
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

	const recordTap = async (studentName: string, choice: string) => {
	const tapType = isPositiveChoice(choice) ? 'positive' : 'negative';
	try {
		await fetch(`${API_URL}/taps/record`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				student_name: studentName,
				tap_type: tapType,
				choice: choice
			})
		});
	} catch (err) {
		console.warn('Failed to record tap:', err);
	}
	};

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

			students.forEach(student => {
				if (student.name !== 'Photo Name' && !student.name.startsWith('Student ')) {
				recordTap(student.name, selectedChoice);
				}
			});

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

			// Record tap for this student
			const student = students.find(s => s.id === studentId);
			if (student && student.name !== 'Photo Name' && !student.name.startsWith('Student ')) {
				recordTap(student.name, selectedChoice);
			}

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
							width: topCardSize,
							height: topCardSize,
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
						width: topCardSize,
						height: topCardSize,
					}
				]}>
					<TextInput
						style={[styles.triangleCardTitle, { fontSize }]}
						value={teacherName}
						onChangeText={setTeacherName}
						placeholder="Teacher Name"
						placeholderTextColor="#000"
						textAlign="center"
					/>
				</View>
				<View style={[
					styles.triangleCard, 
					{ 
						backgroundColor: getBoxColor(1, 1),
						width: topCardSize,
						height: topCardSize,
					}
				]}>
					<TextInput
						style={[styles.triangleCardTitle, { fontSize }]}
						value={classGrade}
						onChangeText={setClassGrade}
						placeholder="Class Title"
						placeholderTextColor="#000"
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
								width: studentCardSize,
								height: studentCardSize,
							},
							pressed && styles.cardPressed,
						]}
					>
						{!student.recentChoice && (
							<Text
								style={[styles.triangleCardTitle, { fontSize }]}
							>
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

	// Refresh displayed data from existing database (student names, teacher info, and tap points)
	const updateRoster = async () => {
		if (updatingRoster) return;
		setUpdatingRoster(true);
		try {
			// Fetch fresh student data and their tap points
			await fetchStudents();
			
			// Fetch teacher info from backend metadata table
			const teacherRes = await fetch(`${API_URL}/teacher-info`);
			if (teacherRes.ok) {
				const teacherData = await teacherRes.json();
				setTeacherName(teacherData.teacher_name || teacherName);
				setClassGrade(teacherData.grade || classGrade);
			}
			
			Alert.alert('Roster Refreshed', 'Student data and tap information have been reloaded from the database.');
		} catch (err: any) {
			const msg = err?.message || 'Unknown error';
			Alert.alert('Refresh Failed', `Could not refresh roster data. ${msg}`);
		} finally {
			setUpdatingRoster(false);
		}
	};

	// Populate roster from Excel file into database
	const populateRoster = async () => {
		if (populatingRoster) return;
		setPopulatingRoster(true);
		const controller = new AbortController();
		const timeout = setTimeout(() => controller.abort(), 15000);
		try {
			const res = await fetch(`${API_URL}/populate-roster`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ initiatedAt: new Date().toISOString() }),
				signal: controller.signal,
			});
			clearTimeout(timeout);
			if (!res.ok) {
				const text = await res.text().catch(() => 'Unknown error');
				throw new Error(`HTTP ${res.status}: ${text}`);
			}
			const result = await res.json();
			// Set teacher name and grade from backend response
			setTeacherName(result.teacher_name || 'Teacher Name');
			setClassGrade(result.grade || 'Grade');
			// After successful populate, re-fetch students
			await fetchStudents();
			Alert.alert('Roster Populated', 'The class roster has been loaded from the Excel file and database updated.');
		} catch (err: any) {
			const msg = err?.name === 'AbortError' ? 'Request timed out.' : (err?.message || 'Unknown error');
			Alert.alert('Populate Failed', `Could not populate roster from Excel. ${msg}`);
		} finally {
			setPopulatingRoster(false);
		}
	};

		const generateReport = async () => {
		if (!selectedStudentForReport) {
			Alert.alert('No Student Selected', 'Please select a student to generate a report for.');
			return;
		}
	
		setGeneratingReport(true);
		try {
			const currentMonth = new Date().toLocaleDateString('en-US', { month: 'long' });
			const currentYear = new Date().getFullYear();
		
			const monthIndex = new Date().getMonth();
			const monthConfig = monthlyEquations[monthIndex];
			const characterEquations = [
				monthConfig.trait1.replace('+ ', ''),
				monthConfig.trait2.replace('+ ', ''),
				monthConfig.result
			].filter(t => t);
		
			const res = await fetch(`${API_URL}/reports/generate`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					student_name: selectedStudentForReport,
					month: currentMonth,
					year: currentYear,
					character_equations: characterEquations.length > 0 ? characterEquations : undefined
				})
			});
		
			if (!res.ok) {
				const error = await res.json();
				throw new Error(error.detail || 'Report generation failed');
			}
		
			const result = await res.json();
			Alert.alert(
				'Report Generated!',
				`Report for ${result.student_name} has been created successfully.\\n\\nFilename: ${result.filename}`,
				[
					{
						text: 'Download',
						onPress: () => {
							const downloadUrl = `${API_URL}/reports/download/${result.filename}`;
							if (typeof window !== 'undefined') {
								window.open(downloadUrl, '_blank');
							}
						}
					},
					{ text: 'OK' }
				]
			);
			setShowReportDialog(false);
			setSelectedStudentForReport('');
		} catch (err: any) {
			Alert.alert('Report Generation Failed', err.message || 'Unknown error occurred');
		} finally {
			setGeneratingReport(false);
		}
	};

	return (
		<SafeAreaView style={styles.safeArea}>
			<ScrollView 
				style={{ backgroundColor: '#e0f2ff' }} 
				contentContainerStyle={styles.container}
			>
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
									source={require('./assets/images/dominoeffect.png')}
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
								<Text style={[styles.settingsText, { fontSize: headerFontSize * 0.9, marginBottom: 10, fontWeight: '700' }]}>Class Selection</Text>
								<Pressable
									onPress={() => {
										fetchAvailableTables();
										setShowClassDialog(true);
									}}
									style={({ pressed }) => [
										styles.settingsActionButton,
										{ backgroundColor: '#2d5aa8' },
										pressed && styles.pressed,
									]}
								>
									<Text style={[styles.settingsActionButtonText, { fontSize: headerFontSize * 0.9 }]}>
										Select Class Table ({selectedTable})
									</Text>
								</Pressable>

								<Text style={[styles.settingsText, { fontSize: headerFontSize * 0.9, marginTop: 20, marginBottom: 10, fontWeight: '700' }]}>Roster Management</Text>
								<Pressable
									onPress={updateRoster}
									disabled={updatingRoster}
									style={({ pressed }) => [
										styles.settingsActionButton,
										updatingRoster && styles.settingsActionButtonDisabled,
										pressed && !updatingRoster && styles.pressed,
									]}
								>
									<Text style={[styles.settingsActionButtonText, { fontSize: headerFontSize * 0.9 }]}> 
										{updatingRoster ? 'Refreshing Data…' : 'Update Roster'}
									</Text>
								</Pressable>

								<Pressable
									onPress={populateRoster}
									disabled={populatingRoster}
									style={({ pressed }) => [
										styles.settingsActionButton,
										{ backgroundColor: '#c93a3a', marginTop: 10 },
										populatingRoster && styles.settingsActionButtonDisabled,
										pressed && !populatingRoster && styles.pressed,
									]}
								>
									<Text style={[styles.settingsActionButtonText, { fontSize: headerFontSize * 0.9 }]}> 
										{populatingRoster ? 'Resetting from Excel…' : 'Reset Roster'}
									</Text>
								</Pressable>

								<Text style={[styles.settingsText, { fontSize: headerFontSize * 0.9, marginTop: 20, marginBottom: 10, fontWeight: '700' }]}>Report Generation</Text>
								<Pressable
									onPress={() => setShowReportDialog(true)}
									style={({ pressed }) => [
									styles.settingsActionButton,
									{ backgroundColor: '#2d5aa8' },
									pressed && styles.pressed,
									]}
								>
									<Text style={[styles.settingsActionButtonText, { fontSize: headerFontSize * 0.9 }]}>
										Generate Student Report
									</Text>
								</Pressable>
							</View>
						</View>
					</View>
				)}

					{/* Report Generation Dialog */}
					{showReportDialog && (
						<View style={styles.settingsOverlay}>
							<View style={styles.settingsPopup}>
								<View style={styles.settingsHeader}>
									<Text style={[styles.settingsTitle, { fontSize: headerFontSize * 1.2 }]}>Generate Report</Text>
									<Pressable onPress={() => { setShowReportDialog(false); setSelectedStudentForReport(''); }} style={styles.closeButton}>
										<Text style={[styles.closeButtonText, { fontSize: headerFontSize * 1.5 }]}>×</Text>
									</Pressable>
								</View>
								<View style={styles.settingsContent}>
									<Text style={[styles.settingsText, { fontSize: headerFontSize * 0.85, marginBottom: 10 }]}>
									Select a student to generate their behavioral progress report:
									</Text>
				
									<ScrollView style={styles.studentListScroll} nestedScrollEnabled>
										{students
											.filter(s => s.name !== 'Photo Name' && !s.name.startsWith('Student '))
											.map((student) => (
												<Pressable
													key={student.id}
													onPress={() => setSelectedStudentForReport(student.name)}
													style={({ pressed }) => [
														styles.studentListItem,
														selectedStudentForReport === student.name && styles.studentListItemSelected,
														pressed && styles.pressed,
													]}
												>
													<Text style={[
														styles.studentListItemText,
														{ fontSize: headerFontSize * 0.8 },
														selectedStudentForReport === student.name && styles.studentListItemTextSelected
													]}>
														{student.name}
													</Text>
													{selectedStudentForReport === student.name && (
														<Text style={[styles.studentListItemCheck, { fontSize: headerFontSize * 1.2 }]}>✓</Text>
													)}
												</Pressable>
											))
										}
									</ScrollView>
				
									<Pressable
										onPress={generateReport}
										disabled={!selectedStudentForReport || generatingReport}
										style={({ pressed }) => [
											styles.settingsActionButton,
											{ marginTop: 15, backgroundColor: '#2d5aa8' },
											(!selectedStudentForReport || generatingReport) && styles.settingsActionButtonDisabled,
											pressed && selectedStudentForReport && !generatingReport && styles.pressed,
										]}
									>
										<Text style={[styles.settingsActionButtonText, { fontSize: headerFontSize * 0.9 }]}>
											{generatingReport ? 'Generating Report…' : 'Generate Report'}
										</Text>
									</Pressable>
							</View>
						</View>
					</View>
				)}

				{/* Class Table Selection Dialog */}
				{showClassDialog && (
					<View style={styles.settingsOverlay}>
						<View style={styles.settingsPopup}>
							<View style={styles.settingsHeader}>
								<Text style={[styles.settingsTitle, { fontSize: headerFontSize * 1.2 }]}>Select Class Table</Text>
								<Pressable onPress={() => { setShowClassDialog(false); }} style={styles.closeButton}>
									<Text style={[styles.closeButtonText, { fontSize: headerFontSize * 1.5 }]}>×</Text>
								</Pressable>
							</View>
							<View style={styles.settingsContent}>
								<Text style={[styles.settingsText, { fontSize: headerFontSize * 0.85, marginBottom: 10 }]}>
									Select which class table to display:
								</Text>

								<ScrollView style={styles.studentListScroll} nestedScrollEnabled>
									{availableTables.map((table) => (
										<Pressable
											key={table}
											onPress={() => {
												setSelectedTable(table);
												fetchStudents(table);
												setShowClassDialog(false);
											}}
											style={({ pressed }) => [
												styles.studentListItem,
												selectedTable === table && styles.studentListItemSelected,
												pressed && styles.pressed,
											]}
										>
											<Text style={[
												styles.studentListItemText,
												{ fontSize: headerFontSize * 0.8 },
												selectedTable === table && styles.studentListItemTextSelected
											]}>
												{table}
											</Text>
											{selectedTable === table && (
												<Text style={[styles.studentListItemCheck, { fontSize: headerFontSize * 1.2 }]}>✓</Text>
											)}
										</Pressable>
									))}
								</ScrollView>
							</View>
						</View>
					</View>
				)}

				{/* Main Content */}
				<View style={styles.mainContent}>
					{/* Left Side - Choice Taps */}
					<View style={styles.leftSection}>
						{/* Choice Taps */}
						<View style={styles.choiceTapsRow}>
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
												<Text
													style={[
														styles.choiceButtonText,
														{ fontSize: headerFontSize * 0.67 },
														selectedChoice === positiveChoices[index] && styles.choiceButtonTextActive,
													]}
												>
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
												<Text
													style={[
														styles.choiceButtonText,
														{ fontSize: headerFontSize * 0.67 },
														selectedChoice === negativeChoices[index] && styles.choiceButtonTextActive,
													]}
												>
													{negativeChoices[index]}
												</Text>
											</Pressable>
										</View>
									</View>
								))}
							</View>
						</View>

						{/* Character Equation ABOVE Directions */}
						<View style={styles.bottomRow}>
							{/* Character Equation - Only show if month has an equation */}
							{characterTrait1 && characterTrait2 && (
								<View style={styles.characterEquationRow}>
								{/* Previous Traits dropdown box */}
								<View
									style={[
									styles.previousTraitsContainer,
									{ backgroundColor: previousTraitBoxColor },
									]}
								>
									<Text style={styles.previousTraitsLabel}>
									Previous Character Equation Traits
									</Text>

									{previousTraits.length === 0 ? (
									<Text style={styles.previousTraitsEmptyText}>
										No previous traits for this month.
									</Text>
									) : (
									<>
										{/* Selector header */}
										<Pressable
										onPress={() =>
											setIsPreviousTraitDropdownOpen((open) => !open)
										}
										style={({ pressed }) => [
											styles.previousTraitsSelector,
											pressed && styles.pressed,
										]}
										>
										<Text style={styles.previousTraitsSelectorText}>
											{selectedPreviousTrait
											? selectedPreviousTrait.label
											: 'Select a previous trait'}
										</Text>
										<Text style={styles.previousTraitsSelectorArrow}>
											{isPreviousTraitDropdownOpen ? '▲' : '▼'}
										</Text>
										</Pressable>

										{selectedPreviousTrait ? (
										<View style={styles.previousTraitsSelectedInfo}>
											<Text style={styles.previousTraitsSelectedText}>
												Selected: {selectedPreviousTrait.label}
											</Text>
											<Pressable
												onPress={() => {
													// Clear the previous-trait selection AND the choice tap
													setSelectedPreviousTraitKey(null);
													setSelectedChoice('');
												}}
												style={({ pressed }) => [
													styles.previousTraitsClearButton,
													pressed && styles.pressed,
												]}
											>
												<Text style={styles.previousTraitsClearButtonText}>
													Clear selection
												</Text>
											</Pressable>
										</View>
									) : (
										<Text style={styles.previousTraitsSelectedText}>
											No previous trait selected.
										</Text>
									)}


										{/* Dropdown options */}
										{isPreviousTraitDropdownOpen && (
										<ScrollView
											style={styles.previousTraitsDropdown}
											nestedScrollEnabled
										>
											{['Health', 'Liberty', 'Happiness', 'Other'].map((category) => {
												const groupTraits = previousTraits.filter(
													(t) => getTraitCategory(t.color) === category
												);
												if (!groupTraits.length) return null;

												const headerColor =
													category === 'Health'
														? '#fff9c4'
														: category === 'Liberty'
														? '#d9e2f7'
														: category === 'Happiness'
														? '#ffcdd2'
														: '#fef8dc';

												return (
													<View key={category}>
														{/* Category header: "Health", "Liberty", "Happiness" */}
														<View
															style={[
																styles.previousTraitsGroupHeader,
																{ backgroundColor: headerColor },
															]}
														>
															<Text style={styles.previousTraitsGroupHeaderText}>
																{category}
															</Text>
														</View>

														{groupTraits.map((trait) => (
															<Pressable
																key={trait.key}
																onPress={() => {
																	const newChoice = `+ ${trait.label}`; // ALWAYS POSITIVE

																	setSelectedPreviousTraitKey((prevKey) =>
																		prevKey === trait.key ? null : trait.key
																	);

																	setSelectedChoice((prevChoice) =>
																		prevChoice === newChoice ? '' : newChoice
																	);

																	setIsPreviousTraitDropdownOpen(false);
																}}
																style={({ pressed }) => [
																	styles.previousTraitsOption,
																	{ backgroundColor: trait.color }, // 👈 tint by month color
																	selectedPreviousTraitKey === trait.key &&
																		styles.previousTraitsOptionSelected,
																	pressed && styles.pressed,
																]}
															>
																<Text
																	style={[
																		styles.previousTraitsOptionText,
																		selectedPreviousTraitKey === trait.key &&
																			styles.previousTraitsOptionTextSelected,
																	]}
																>
																	{trait.label}
																</Text>
															</Pressable>
														))}
													</View>
												);
											})}

										</ScrollView>
										)}
									</>
									)}
								</View>

								{/* Existing Character Equation block */}
								<View style={[styles.characterEquation]}>
									<View style={styles.equationContent}>
									<View
										style={[
										styles.equationHeader,
										{ backgroundColor: equationBgColor },
										]}
									>
										<Text
										style={[
											styles.equationHeaderText,
											{ fontSize: headerFontSize * 0.9 },
										]}
										>
										Focus Character Equation:
										</Text>
									</View>

									<View style={styles.equationRowWithSign}>
										<View style={styles.signTextSpacer} />
										<Pressable
										onPress={() => handleChoiceClick(characterTrait1)}
										style={({ pressed }) => [
											styles.characterBox,
											styles.characterBoxWithSign,
											{ backgroundColor: equationBgColor },
											selectedChoice === characterTrait1 &&
											styles.choiceButtonActivePositive,
											pressed && styles.pressed,
										]}
										>
										<Text
											style={[
											styles.characterText,
											{ fontSize: headerFontSize * 0.8 },
											selectedChoice === characterTrait1 &&
												styles.choiceButtonTextActive,
											]}
										>
											{characterTrait1}
										</Text>
										</Pressable>
									</View>

									<View style={styles.equationRowWithSign}>
										<Text
										style={[
											styles.signText,
											{ fontSize: pawsFontSize * 0.9 },
										]}
										>
										+
										</Text>
										<Pressable
										onPress={() => handleChoiceClick(characterTrait2)}
										style={({ pressed }) => [
											styles.characterBox,
											styles.characterBoxWithSign,
											{ backgroundColor: equationBgColor },
											selectedChoice === characterTrait2 &&
											styles.choiceButtonActivePositive,
											pressed && styles.pressed,
										]}
										>
										<Text
											style={[
											styles.characterText,
											{ fontSize: headerFontSize * 0.8 },
											selectedChoice === characterTrait2 &&
												styles.choiceButtonTextActive,
											]}
										>
											{characterTrait2}
										</Text>
										</Pressable>
									</View>

									<View style={styles.equationDivider} />
									<View style={styles.equationRowWithSign}>
										<Text
										style={[
											styles.signText,
											{ fontSize: pawsFontSize * 0.9 },
										]}
										>
										=
										</Text>
										<View
										style={[
											styles.resultBox,
											styles.characterBoxWithSign,
											{ backgroundColor: equationBgColor },
										]}
										>
										<Text
											style={[
											styles.resultText,
											{ fontSize: headerFontSize * 0.95 },
											]}
										>
											{equationResult}
										</Text>
										</View>
									</View>
									</View>

									{/* Badge and Video Link Column */}
									{equationBadgeImage !== null && (
									<View style={styles.badgeAndLinkColumn}>
										{badgeImages[equationBadgeImage] && (
										<View style={styles.badgeImageContainer}>
											<Image
											source={badgeImages[equationBadgeImage]}
											style={styles.badgeImage}
											resizeMode="contain"
											/>
										</View>
										)}

										<Pressable
										onPress={() => {
											const videoUrl =
											monthlyEquations[new Date().getMonth()].videoUrl;
											if (videoUrl && typeof window !== 'undefined') {
											window.open(videoUrl, '_blank');
											}
										}}
										style={({ pressed }) => [
											styles.videoLinkButton,
											{ backgroundColor: equationBgColor },
											pressed && styles.pressed,
										]}
										>
										<Text
											style={[
											styles.videoLinkText,
											{ fontSize: headerFontSize * 0.6 },
											]}
										>
											📺 Watch This Month&apos;s Video
										</Text>
										</Pressable>
									</View>
									)}
								</View>
								</View>  
							)}

							{/* User Directions Box (now below equation) */}
							<View style={styles.directionsBox}>
								<Text
								style={[
									styles.directionsText,
									{ fontSize: headerFontSize * 0.7 },
								]}
								>
								Directions:{'\n\n'}
								1. Select a choice tap above.{'\n'}
								2. Tap a student card to record.{'\n'}
								3. Tap "Select All Students" to apply to everyone.{'\n'}
								4. Tap without choice selected to view score.
								</Text>
							</View>
							</View>

					</View>

					{/* Right Side - Triangle + Venn Diagram */}
					<View style={[styles.triangleContainer, { gap: cardGap }]}>
					{/* Venn diagram positioned in the blank space of the triangle.
						pointerEvents="none" so it doesn't block taps on cards. */}
					<View
						pointerEvents="none"
						style={[
						styles.vennDiagramContainer,
						{
							width: cardSize * 8,
							height: cardSize * 5,
							top: cardSize * -0.1,
							left: cardSize * -1.2,
						},
						]}
					>
						<Image
						source={require('./assets/images/venndiagram.png')}
						style={styles.vennDiagramImage}
						resizeMode="contain"
						/>
					</View>

					{renderTriangle()}
					</View>

				</View>

			</ScrollView>
		</SafeAreaView>
	);
}

