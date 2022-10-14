const { QueryTypes } = require("sequelize");
const { sequelize } = require("../database");

const fetchFacilities = async (req, res) => {
  try {
    // get facilities from db
    const facilities = await sequelize.query("SELECT * from facilities", {
      type: QueryTypes.SELECT,
    });
    res.status(200).json({ facilities });
  } catch (err) {
    res.status(500).json({ status: 500, message: err.message });
  }
};

const fetchNurseOrder = async (req, res) => {
  try {
    const { facility_id } = req.body;
    const histories = await sequelize.query(
      `SELECT * from clinician_work_history where facility_id=${facility_id}`,
      {
        type: QueryTypes.SELECT,
      }
    );
    const nurses = new Map();

    // calculate points for each nurses
    histories.forEach(
      ({ nurse_id, worked_shift, call_out, no_call_no_show }) => {
        let point = 0;
        if (worked_shift) point++;
        if (call_out) point -= 3;
        if (no_call_no_show) point -= 5;

        if (!nurses.has(nurse_id)) {
          const nurse = {
            nurse_id,
            point,
          };
          nurses.set(nurse_id, nurse);
        } else {
          const nurse = nurses.get(nurse_id);
          nurse.point = nurse.point + point;
        }
      }
    );

    // make array from Map Object
    const orders = Array.from(nurses, ([nurse_id, nurse]) => ({
      nurse_id,
      ...nurse,
    }));
    // sort by point
    orders.sort((a, b) => b.point - a.point);

    const orderNums = orders.map(({ nurse_id }) => nurse_id);

    res.status(200).json({ orders: orderNums });
  } catch (err) {
    res.status(500).json({ status: 500, message: err.message });
  }
};

// Q4
const fetchSpots = async (req, res) => {
  try {
    const jobs = await sequelize.query(
      "SELECT jobs.job_id, jobs.total_number_nurses_needed, COUNT(nurse_hired_jobs) as hired FROM jobs LEFT JOIN nurse_hired_jobs ON nurse_hired_jobs.job_id = jobs.job_id GROUP BY jobs.job_id;",
      {
        type: QueryTypes.SELECT,
      }
    );
    const spots = jobs.map(({ job_id, total_number_nurses_needed, hired }) => {
      const spot = total_number_nurses_needed - hired;
      return {
        job_id,
        spots: spot,
      };
    });
    spots.sort((a, b) => a.job_id - b.job_id);
    res.status(200).json({ spots });
  } catch (err) {
    res.status(500).json({ status: 500, message: err.message });
  }
};

// Q5
const fetchNurses = async (req, res) => {
  try {
    const nurses = await sequelize.query(
      "SELECT * from nurses ORDER BY nurse_id;",
      {
        type: QueryTypes.SELECT,
      }
    );

    // get jobs with num of nurses hired for that job by LEFT JOIN QUERY
    const jobs = await sequelize.query(
      "SELECT jobs.job_id, jobs.total_number_nurses_needed, jobs.nurse_type_needed, COUNT(nurse_hired_jobs) as hired FROM jobs LEFT JOIN nurse_hired_jobs ON nurse_hired_jobs.job_id = jobs.job_id GROUP BY jobs.job_id;",
      {
        type: QueryTypes.SELECT,
      }
    );
    const nurse_hired_jobs = await sequelize.query(
      "SELECT * from nurse_hired_jobs;",
      {
        type: QueryTypes.SELECT,
      }
    );

    // get not filled jobs
    const not_filled_jobs = jobs.filter(
      (job) => job.total_number_nurses_needed - job.hired > 0
    );
    console.log("not_filled_jobs", not_filled_jobs);

    // sum spots for each nurses
    const nursesWithJobSpots = nurses.map((nurse) => {
      const { nurse_id, nurse_type } = nurse;
      let spot = 0;
      let filteredJobs = not_filled_jobs.filter(
        ({ nurse_type_needed }) => nurse_type_needed === nurse_type
      );
      filteredJobs.forEach(({ job_id }) => {
        const isHired = nurse_hired_jobs.find(
          (job) => job_id === job.job_id && job.nurse_id === nurse_id
        );
        if (!isHired) {
          spot += 1;
        }
      });
      return {
        ...nurse,
        spots: spot,
      };
    });
    res.status(200).json({ nurses: nursesWithJobSpots });
  } catch (err) {
    res.status(500).json({ status: 500, message: err.message });
  }
};

// Q6
const fetchFacilitiesWithBestNurse = async (req, res) => {
  try {
    // get all facilities from db
    const _facilities = await sequelize.query("select * from facilities", {
      type: QueryTypes.SELECT,
    });
    // get all nurses from db
    const _nurses = await sequelize.query(
      "SELECT * from nurses ORDER BY nurse_id;",
      {
        type: QueryTypes.SELECT,
      }
    );
    // get job history with nurse hired
    const jobs = await sequelize.query(
      "SELECT * from jobs LEFT JOIN nurse_hired_jobs on jobs.job_id = nurse_hired_jobs.job_id;",
      {
        type: QueryTypes.SELECT,
      }
    );

    // count nurse's history for each facilities
    const facilities = [];
    jobs.forEach((job) => {
      const facility = facilities.find(
        (facility) => facility.facility_id === job.facility_id
      );
      if (facility) {
        const { nurse_id } = job;
        const { nurses } = facility;
        if (nurse_id) {
          let nurseCount = nurses.get(nurse_id);
          if (!nurseCount) nurseCount = 0;
          nurses.set(nurse_id, nurseCount + 1);
        }
      } else {
        const nurses = new Map();
        facilities.push({
          facility_id: job.facility_id,
          nurses,
        });
      }
    });

    // get best nurse for each facilities
    const facilitiesWithBestNurse = facilities.map(
      ({ nurses, facility_id }) => {
        const nursesCounts = Array.from(nurses, ([nurse_id, count]) => ({
          nurse_id,
          count,
        }));
        nursesCounts.sort((a, b) => b.count - a.count);

        // find facility and nurse
        const facility = _facilities.find(
          (__facility) => __facility.facility_id === facility_id
        );
        if (facility) {
          if (nursesCounts.length) {
            const nurse_id = nursesCounts[0].nurse_id;
            const nurse = _nurses.find(
              (_nurse) => _nurse.nurse_id === nurse_id
            );
            return {
              ...facility,
              ...nurse,
            };
          } else {
            return facility;
          }
        }
        return null;
      }
    );

    // sort by name
    facilitiesWithBestNurse.sort((a, b) => {
      if (a.facility_name > b.facility_name) return 1;
      else if (a.facility_name < b.facility_name) return -1;
      else return 0;
    });

    res.status(200).json({ facilities: facilitiesWithBestNurse });
  } catch (err) {
    res.status(500).json({ status: 500, message: err.message });
  }
};

module.exports = {
  fetchFacilities,
  fetchNurseOrder,
  fetchSpots,
  fetchNurses,
  fetchFacilitiesWithBestNurse,
};
