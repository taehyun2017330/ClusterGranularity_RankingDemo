import React, { useState, useEffect } from 'react';
import * as d3 from 'd3';
import Scatterplot from './Scatterplot'; // A component to render scatterplots

const App = () => {
    const [currentPage, setCurrentPage] = useState(0);
    const [scatterplots, setScatterplots] = useState([]);
    const [currentMatchup, setCurrentMatchup] = useState([0, 1]); // Indices of the scatterplots in the current matchup
    const [eloScores, setEloScores] = useState(new Array(20).fill(1000)); // Initial ELO scores
    const [comparisonCount, setComparisonCount] = useState(0);
    const [eloHistory, setEloHistory] = useState([]);
    const [unsurePairs, setUnsurePairs] = useState([]);



    const pageStyles = {
        textAlign: 'center',
        marginTop: '50px',
        padding: '20px',
    };
    
    const paragraphStyles = {
        fontSize: '18px',
        lineHeight: '1.6',
        maxWidth: '800px',
        margin: 'auto',
        textAlign: 'justify',
    };
    
    const buttonStyles = {
        backgroundColor: '#4CAF50', // Feel free to change the color
        color: 'white',
        padding: '10px 20px',
        fontSize: '16px',
        borderRadius: '5px',
        cursor: 'pointer',
        border: 'none',
        marginTop: '20px',
    };
    

    useEffect(() => {
        // Load scatterplots data from JSON files in public/pickedpoints3
        const loadScatterplots = async () => {
            let loadedScatterplots = [];
            for (let i = 1; i <= 20; i++) { // Adjust the loop for the number of your scatterplots
                const data = await d3.json(`pickedpoints3/${i}.json`);
                loadedScatterplots.push(data);
            }
            setScatterplots(loadedScatterplots);
        };

        loadScatterplots();
    }, []);
    const getNextMatchup = (eloScores, lastMatchup) => {
        // Randomly select one scatterplot
        const firstIndex = Math.floor(Math.random() * scatterplots.length);
    
        // Find the closest ELO score scatterplot that is not the same as the first
        let secondIndex = eloScores.reduce((closest, currentScore, currentIndex) => {
            if (currentIndex !== firstIndex) {
                const closestDiff = Math.abs(eloScores[closest] - eloScores[firstIndex]);
                const currentDiff = Math.abs(currentScore - eloScores[firstIndex]);
                return currentDiff < closestDiff ? currentIndex : closest;
            }
            return closest;
        }, firstIndex === 0 ? 1 : 0);
    
        return [firstIndex, secondIndex];
    };
    

    const handleScatterplotSelection = (selectedIndex, unsure = false) => {
        let newEloScores = [...eloScores];
        const [index1, index2] = currentMatchup;
    
        if (unsure) {
            setUnsurePairs([...unsurePairs, currentMatchup]);
        }
    
        if (!unsure) {
            // Calculate Win Probability
            const winProb1 = 1 / (Math.pow(10, (newEloScores[index2] - newEloScores[index1]) / 400) + 1);
            const winProb2 = 1 - winProb1;
    
            // Scoring Points
            const score1 = selectedIndex === 0 ? 1 : 0;
            const score2 = selectedIndex === 1 ? 1 : 0;
    
            // Update ELO scores
            newEloScores[index1] = newEloScores[index1] + 32 * (score1 - winProb1);
            newEloScores[index2] = newEloScores[index2] + 32 * (score2 - winProb2);
        }
    
        setEloScores(newEloScores);
        setComparisonCount(count => count + 1);
        setEloHistory(history => [...history, newEloScores]);
    
        // Determine the next matchup
        const newMatchup = unsure ? getNextMatchupAvoidingCurrent(index1, index2) : getNextMatchup(newEloScores, currentMatchup);
    
        if (newMatchup === null) {
            // No valid matchup left, transition to the end page
            console.log("No more valid matchups. Ending experiment.");
            setCurrentPage(4);
            return;
        }
    
        setCurrentMatchup(newMatchup);
    
        // Check if the experiment should end
        checkIfShouldEnd(comparisonCount, eloHistory, newEloScores, unsure);
    };
    
    const getNextMatchupAvoidingCurrent = (avoidIndex1, avoidIndex2) => {
        let potentialMatchup;
        let attempts = 0;
        const maxAttempts = 50; // Set a reasonable limit to attempts
    
        do {
            potentialMatchup = getNextMatchup(eloScores, currentMatchup);
            attempts++;
            if (attempts > maxAttempts) {
                // No valid matchup found, return null
                return null;
            }
        } while (unsurePairs.some(pair => 
                    (pair[0] === potentialMatchup[0] && pair[1] === potentialMatchup[1]) ||
                    (pair[0] === potentialMatchup[1] && pair[1] === potentialMatchup[0])
                ));
    
        return potentialMatchup;
    };
    

    const MIN_COMPARISONS = 40; // Adjust this number based on your requirements
    const STABILITY_THRESHOLD = 6; // Number of comparisons to check for stability
    const MAX_COMPARISONS = 80; // Adjust this number based on your requirements
    
    
    const [unsureCount, setUnsureCount] = useState(0); // Track the number of times 'Unsure' is selected

const checkIfShouldEnd = (count, history, currentScores, unsure) => {
    if (unsure) {
        setUnsureCount(prevUnsureCount => prevUnsureCount + 1);
    }

    if (count < MIN_COMPARISONS) return;

    // Check if 'Unsure' was selected for every matchup
    if (unsureCount >= count) {
        console.log("Experiment ended due to excessive uncertainty.");
        setCurrentPage(4); // End page
        return;
    }
    if (count >MAX_COMPARISONS) {
        setCurrentPage(4); // End page
        return;
    }

    // Check the stability of rankings
    if (history.length >= STABILITY_THRESHOLD + 1) {
        if (areScoresStable(history)) {
            console.log("Experiment ended due to stable rankings.");
            setCurrentPage(4); // End page
            return;
        }
    }
};

    
    
 

const areScoresStable = (history) => {
    const historyLength = history.length;
    const changeThreshold = 5; // Adjust this value based on your analysis

    if (historyLength < STABILITY_THRESHOLD + 1) {
        // Not enough data to determine stability
        return false;
    }

    const currentScores = history[historyLength - 1];
    const comparisonScores = history[historyLength - 1 - STABILITY_THRESHOLD];

    return currentScores.every((score, index) => Math.abs(score - comparisonScores[index]) <= changeThreshold);
};

const renderEloTable = () => {
    return (
        <div style={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap', marginTop: '20px' }}>
            {eloScores.map((score, index) => (
                <div key={index} style={{ border: '1px solid black', padding: '8px', margin: '5px' }}>
                    <strong>Scatterplot {index + 1}:</strong> {score.toFixed(2)}
                </div>
            ))}
        </div>
    );
};



const downloadEloScores = () => {
    const eloText = eloScores.map((score, index) => `Scatterplot ${index + 1}: ${score}`).join('\n');
    const blob = new Blob([eloText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'elo_scores.txt';
    link.click();
    URL.revokeObjectURL(url);
};


  

    const renderPage = () => {
        switch (currentPage) {
            case 0:
    return (
        <div style={pageStyles}>
            <h1>Welcome to the Cluster Granularity Ranking Experiment</h1>
            <p style={paragraphStyles}>
                Here you will be comparing two different clusters to judge which one seems more 
                detailed and fine-grained from your perspective. Keep in mind! This is an experiment 
                based on the variability of human perception, so there is no absolute answer!
            </p>
            <button style={buttonStyles} onClick={() => setCurrentPage(1)}>Next</button>
        </div>
    );

    case 1:
    return (
        <div style={pageStyles}>
            <h1>So, What is Cluster Granularity?</h1>
            <p style={paragraphStyles}>
                <b>Cluster Granularity</b> can be defined as the degree of distinctiveness and resolution 
                in the grouping of data points within a visualization. In other words, higher granularity 
                indicates a greater number of <b>finely divided</b> and <b>clearly distinguishable clusters and outliers</b>.
            </p>
            <div>
                <img src="Image A.png" alt="Scatterplot A" style={{ width: '50%', height: 'auto' }} />
            </div>
            <p style={paragraphStyles}>In this example, most people will claim that scatterplot A is more fine-grained than scatterplot B because the clusters are <b>clearly distinguishable</b>.</p>
            <div>
            <img src="Image B.png" alt="Scatterplot B" style={{ width: '50%', height: 'auto' }} />
            </div>
            <p style={paragraphStyles}>And in this example, most people will claim that scatterplot B is more fine-grained than scatterplot A because there are <b>more numbers</b> of finely divided clusters!</p>
            <button style={buttonStyles} onClick={() => setCurrentPage(0)}>Previous</button>
            <button style={buttonStyles} onClick={() => setCurrentPage(2)}>Next</button>
        </div>
    );


    case 2:
        return (
            <div style={pageStyles}>
                <h1>The Challenge</h1>
                <p style={paragraphStyles}>
                    The challenge becomes when we are comparing two very different Scatterplots. 
                    However, just try to keep in mind of two important features:
                </p>
                <div>
                <ol style={paragraphStyles}>
                    <li><b>Try to find clearly distinguished clusters and outliers.</b></li>
                    <li><b>Try to find as many of them as possible!</b></li>
                </ol>
                </div>
                <div>
                <img src="Image C.png" alt="Scatterplot A" style={{ width: '50%', height: 'auto' }} />
            </div>
                {/* Place for another example image */}
                <p style={paragraphStyles}>
                    You will now be ranking 20 Scatterplots based on which is more finely grained than the other. Sometimes if you are unsure about which cluster is more granular, you can use the <b>unsure button.</b> 
                    This will not alter the ranking and avoid the two pairings in the future. However, if you press it too many times, the experiment will end prematurely. The experiment will also stop when you have made enough comparisons, or the ranking system has been 
                    stabilized. Once the experiment stops, you will get a download link where you can download 
                    the output file. Good luck!
                </p>
                <button style={buttonStyles} onClick={() => setCurrentPage(1)}>Previous</button>
                <button style={buttonStyles} onClick={() => setCurrentPage(3)}>Start Experiment</button>
            </div>
        );
    
        case 3:
    return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
            <h2>Task: Please choose the scatterplot that seems more fine grained to your eyes</h2>
            <h3>Higher granularity indicates a greater number of finely divided and clearly distinguishable clusters and outliers.</h3>
            <p>Current Comparison Count: {comparisonCount}</p>
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px' }}>
                <Scatterplot 
                    id={currentMatchup[0] + 1} 
                    data={scatterplots[currentMatchup[0]]} 
                    onSelect={() => handleScatterplotSelection(0)} 
                />
                <Scatterplot 
                    id={currentMatchup[1] + 1} 
                    data={scatterplots[currentMatchup[1]]} 
                    onSelect={() => handleScatterplotSelection(1)} 
                />
            </div>
            <button style={buttonStyles} onClick={() => handleScatterplotSelection(-1, true)}>Unsure</button>
            {}
        </div>
    );

    case 4: // End page
    return (
        <div style={{ textAlign: 'center', marginTop: '50px' }}>
            <h2>Thank You for Participating!</h2>
            <button onClick={downloadEloScores}>Download ELO Scores</button>
        </div>
    );

            default:
                return <div>Invalid Page</div>;
        }
    };

    return (
        <div>
            {renderPage()}
        </div>
    );
}

export default App;
